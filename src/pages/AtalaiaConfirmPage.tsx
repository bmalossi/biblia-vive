import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Heart, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function AtalaiaConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  usePageMeta({
    title: "Confirmação de Cuidado Pastoral — Bíblia Vive · Atalaia",
    description: "Confirmação discreta de papel pastoral no Bíblia Vive e Memorial.",
    canonical: "/atalaia/confirmar",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<{
    valid: boolean;
    contact_name?: string;
    requester_name?: string;
    role?: string;
    error?: string;
  } | null>(null);

  const [result, setResult] = useState<{
    success: boolean;
    status?: "active" | "rejected";
    requester_name?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    async function loadTokenInfo() {
      if (!token) {
        setInfo({ valid: false, error: "Token de confirmação não fornecido na URL." });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_pastoral_invitation_info", {
          p_token: token,
        });

        if (error) {
          console.error("Erro ao verificar token:", error);
          setInfo({ valid: false, error: "Não foi possível validar o convite no momento." });
        } else if (!data?.valid) {
          let errorMsg = "Este convite é inválido ou já foi utilizado.";
          if (data?.error === "expired") {
            errorMsg = "Este convite expirou (a validade máxima é de 48 horas).";
          } else if (data?.error === "already_processed") {
            errorMsg = `Este convite já foi processado anteriormente (status: ${data?.status || "concluído"}).`;
          }
          setInfo({ valid: false, error: errorMsg });
        } else {
          setInfo(data);
        }
      } catch (err: any) {
        setInfo({ valid: false, error: err?.message || "Erro inesperado ao consultar convite." });
      } finally {
        setLoading(false);
      }
    }

    loadTokenInfo();
  }, [token]);

  const handleDecision = async (action: "accept" | "decline") => {
    if (!token || submitting) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("confirm_pastoral_contact_by_token", {
        p_token: token,
        p_action: action,
      });

      if (error) {
        console.error("Erro ao registrar decisão:", error);
        setResult({
          success: false,
          message: error.message || "Falha ao processar resposta do convite.",
        });
      } else if (data?.success) {
        setResult({
          success: true,
          status: data.status,
          requester_name: data.requester_name,
        });
      } else {
        setResult({
          success: false,
          message: data?.message || "Não foi possível processar a solicitação.",
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || "Erro inesperado ao enviar resposta.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold mb-4" />
            <p className="font-serif text-lg text-app-text">Verificando convite de cuidado pastoral...</p>
            <p className="text-sm text-app-text-muted mt-1">Aguarde um instante.</p>
          </div>
        ) : result ? (
          // Tela de Sucesso após Decisão
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            {result.success && result.status === "active" ? (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-gold">
                  Bíblia Vive · Atalaia
                </span>
                <h1 className="mt-2 text-2xl font-serif font-medium text-app-text">
                  Convite Aceito com Sucesso
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-app-text-muted">
                  Você agora é o Contato de Cuidado pastoral de{" "}
                  <strong className="text-app-text">{result.requester_name || info?.requester_name}</strong>.
                </p>
                <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-5 text-left text-xs leading-relaxed text-app-text-muted">
                  <p className="font-medium text-app-text mb-1">Como funciona a partir de agora?</p>
                  <p>
                    As orações e registros íntimos do leitor continuam sob sigilo sagrado entre ele e Deus.
                    Caso ele passe por um momento difícil e consinta com o envio de um sinal, você receberá um
                    e-mail afetuoso sugerindo puxar assunto com naturalidade em oração.
                  </p>
                </div>
                <div className="mt-8">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    Acessar Bíblia Vive
                  </Link>
                </div>
              </>
            ) : result.success && result.status === "rejected" ? (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-app-text-muted">
                  <Heart className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-serif font-medium text-app-text">
                  Convite Declinado com Respeito
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-app-text-muted">
                  Sua resposta foi registrada. Entendemos suas atribuições pastorais e agradecemos sua sinceridade.
                  Nenhum sinal ou notificação será enviado para o seu e-mail.
                </p>
                <div className="mt-8">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2 text-sm text-app-text hover:bg-muted/50"
                  >
                    Ir para página inicial
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-serif font-medium text-app-text">
                  Não foi possível concluir
                </h1>
                <p className="mt-4 text-sm text-app-text-muted">
                  {result.message || "Ocorreu um erro ao processar sua resposta."}
                </p>
                <div className="mt-8">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2 text-sm text-app-text hover:bg-muted/50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar ao início
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : !info?.valid ? (
          // Erro de Validação de Token
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-serif text-app-text">Convite Não Disponível</h2>
            <p className="mt-3 text-sm text-app-text-muted leading-relaxed">
              {info?.error || "Este link de convite é inválido ou já expirou após a janela de 48 horas."}
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs text-app-text hover:bg-muted"
              >
                Voltar à Bíblia Vive
              </Link>
            </div>
          </div>
        ) : (
          // Apresentação Solene do Convite
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span className="font-mono text-xs uppercase tracking-wider text-gold">
                Atalaia · Cuidado Pastoral
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-serif font-medium text-app-text">
              Convite de Cuidado Pastoral
            </h1>

            <p className="mt-4 text-base text-app-text-muted leading-relaxed">
              Olá, <strong className="text-app-text">{info.contact_name}</strong>.
            </p>

            <p className="mt-2 text-base text-app-text-muted leading-relaxed">
              <strong className="text-app-text">{info.requester_name}</strong> indicou você como sua pessoa
              de confiança e porto seguro de oração no aplicativo Memorial.
            </p>

            {/* Caixa Solene de Governança e Sigilo */}
            <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-5">
              <p className="font-serif text-sm font-semibold text-gold">
                "O Memorial guarda. O Atalaia cuida."
              </p>
              <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
                O Memorial é o lugar sagrado onde o leitor registra orações e confissões íntimas diante de Deus.
                Você <strong>nunca terá acesso às memórias</strong> ou aos textos escritos por ele. Seu papel é
                puramente espiritual: estar pronto para orar e acolher com afeto caso ele sinalize necessidade.
              </p>
            </div>

            <p className="mt-6 text-sm text-app-text-muted leading-relaxed">
              Você não precisa instalar nenhum aplicativo nem criar uma conta. Aceitando este papel, você
              apenas concorda em receber um e-mail discreto caso{" "}
              <strong className="text-app-text">{info.requester_name}</strong> peça apoio em oração.
            </p>

            {/* Ações */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision("accept")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-7 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Aceitar Cuidado Pastoral
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision("decline")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-app-text-muted hover:text-app-text hover:bg-muted/40 transition disabled:opacity-50"
              >
                Declinar com Respeito
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-app-text-muted/70">
              Link único com validade de 48 horas. Você poderá revogar sua disponibilidade a qualquer momento.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
