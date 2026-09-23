// ─────────────────────────────────────────────────────────────────────────────
// HymnCreditsModal.tsx — Bíblia Vive
//
// Modal inline de edição de créditos de gravação de um hino da Harpa Cristã.
// Visível apenas para admins. Salva via useHymnCredits → Supabase app_config.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Mic, X, Save, Loader2, Check, AlertCircle, Music, Play, ExternalLink } from "lucide-react";
import { HymnCredits, useHymnCredits } from "@/hooks/useHymnCredits";

const DEFAULT_AUDIO_BASE_URL = "https://audio.bibliavive.com.br";

function buildTestUrl(fileOrUrl: string): string {
  const trimmed = fileOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const cleanPath = trimmed.replace(/^\/?(harpas\/)?/, "");
  const base = import.meta.env.VITE_R2_AUDIO_URL || DEFAULT_AUDIO_BASE_URL;
  return `${base}/harpas/${encodeURIComponent(cleanPath)}`;
}

interface HymnCreditsModalProps {
  hymnNumber: number;
  hymnTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function HymnCreditsModal({
  hymnNumber,
  hymnTitle,
  open,
  onClose,
}: HymnCreditsModalProps) {
  const { credits, saveCredits, isSaving, saveError } = useHymnCredits(hymnNumber);

  const [form, setForm] = useState<HymnCredits>({ voice: "", source: "", notes: "", sourceUrl: "", audioFile: "" });
  const [saved, setSaved] = useState(false);
  const [testingAudio, setTestingAudio] = useState(false);
  const [audioStatus, setAudioStatus] = useState<"ok" | "not_found" | "error" | null>(null);

  // Sincroniza o formulário quando os créditos atuais carregam
  useEffect(() => {
    if (open) {
      setForm({
        voice: credits?.voice ?? "",
        source: credits?.source ?? "",
        notes: credits?.notes ?? "",
        sourceUrl: credits?.sourceUrl ?? "",
        audioFile: credits?.audioFile ?? credits?.audioUrl ?? "",
      });
      setSaved(false);
      setAudioStatus(null);
    }
  }, [open, credits]);

  if (!open) return null;

  async function handleTestAudio() {
    const input = form.audioFile?.trim();
    if (!input) return;

    setTestingAudio(true);
    setAudioStatus(null);

    try {
      const url = buildTestUrl(input);
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        setAudioStatus("ok");
      } else if (res.status === 404) {
        setAudioStatus("not_found");
      } else {
        setAudioStatus("error");
      }
    } catch {
      setAudioStatus("error");
    } finally {
      setTestingAudio(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    try {
      const payload: HymnCredits = {
        ...form,
      };

      // Se o usuário digitou uma URL completa no audioFile, salva como audioUrl também
      const audioInput = form.audioFile?.trim() || "";
      if (audioInput.startsWith("http://") || audioInput.startsWith("https://")) {
        payload.audioUrl = audioInput;
        payload.audioFile = audioInput;
      } else if (audioInput) {
        payload.audioFile = audioInput;
      }

      await saveCredits(payload);
      setSaved(true);
      // Fecha o modal após 1.2s para o admin ver o feedback
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch {
      // saveError é exposto pelo hook
    }
  }

  function handleField(key: keyof HymnCredits, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Editar créditos — Hino ${hymnNumber}`}
    >
      {/* Painel */}
      <div className="w-full max-w-md rounded-2xl border border-[#382f23]/80 bg-[#161412] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#382f23]/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2219] border border-[#382f23] text-[#e5b869]">
              <Mic className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-[#e5b869]">
                Admin · Créditos da Gravação
              </p>
              <p className="text-xs text-[#a89b8c] truncate max-w-[240px]">
                Hino {hymnNumber} — {hymnTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6e6355] hover:text-[#f4efea] transition-colors p-1"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* Intérprete */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-voice"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Intérprete / Voz
            </label>
            <input
              id="credits-voice"
              type="text"
              value={form.voice ?? ""}
              onChange={(e) => handleField("voice", e.target.value)}
              placeholder="Ex: Coral Luz da Vida"
              className="w-full rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
          </div>

          {/* Fonte */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-source"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Fonte / Origem
            </label>
            <input
              id="credits-source"
              type="text"
              value={form.source ?? ""}
              onChange={(e) => handleField("source", e.target.value)}
              placeholder="Ex: CD Harpa Cristã Vol. 3"
              className="w-full rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
          </div>

          {/* Link da Fonte */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-source-url"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Link da Fonte (Externo)
            </label>
            <input
              id="credits-source-url"
              type="url"
              value={form.sourceUrl ?? ""}
              onChange={(e) => handleField("sourceUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
            <p className="text-[0.62rem] text-[#6e6355]">
              Aparece como "Ouvir gravação original" no card de créditos
            </p>
          </div>

          {/* Arquivo ou Link do Áudio no Cloudflare R2 */}
          <div className="space-y-2 rounded-xl border border-[#382f23]/80 bg-[#1a1713] p-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <label
                htmlFor="credits-audio-file"
                className="flex items-center gap-1.5 font-mono text-[0.68rem] tracking-wider uppercase text-[#e5b869] font-medium"
              >
                <Music className="h-3 w-3" />
                <span>Áudio no Cloudflare R2</span>
              </label>
              {form.audioFile?.trim() && (
                <button
                  type="button"
                  onClick={handleTestAudio}
                  disabled={testingAudio}
                  className="inline-flex items-center gap-1 rounded bg-[#2a2219] border border-[#382f23] px-2 py-0.5 text-[0.65rem] font-mono text-[#e5b869] hover:bg-[#382f23] transition-colors"
                >
                  {testingAudio ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Testando...</span>
                    </>
                  ) : (
                    <span>Testar no R2</span>
                  )}
                </button>
              )}
            </div>
            <input
              id="credits-audio-file"
              type="text"
              value={form.audioFile ?? ""}
              onChange={(e) => {
                handleField("audioFile", e.target.value);
                setAudioStatus(null);
              }}
              placeholder="Ex: 432 - Cláudia Canção - Consagrado ao Senhor.mp3"
              className="w-full rounded-lg border border-[#382f23]/80 bg-[#141210] px-3.5 py-2 text-xs text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all font-mono"
            />

            {/* Feedback do teste de áudio */}
            {audioStatus === "ok" && (
              <p className="flex items-center gap-1.5 text-[0.68rem] text-emerald-400 font-mono">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>Arquivo validado no Cloudflare R2! (200 OK)</span>
              </p>
            )}
            {audioStatus === "not_found" && (
              <p className="flex items-center gap-1.5 text-[0.68rem] text-amber-400 font-mono">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Arquivo não encontrado no R2 (404). Verifique se o nome confere exatamente com o que subiu.</span>
              </p>
            )}
            {audioStatus === "error" && (
              <p className="flex items-center gap-1.5 text-[0.68rem] text-red-400 font-mono">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Não foi possível verificar a URL no Cloudflare R2.</span>
              </p>
            )}

            <p className="text-[0.62rem] text-[#8f8272] leading-relaxed">
              Cole o nome do arquivo que você subiu no bucket <code className="text-[#c69a50]">audio-biblia-cache/harpas/</code> ou a URL completa.
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-notes"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Observações
            </label>
            <textarea
              id="credits-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => handleField("notes", e.target.value)}
              placeholder="Notas editoriais, contexto da gravação..."
              className="w-full resize-none rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
          </div>

          {/* Feedback de erro */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-[#8f8272] hover:text-[#f4efea] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || saved}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-medium transition-all ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-[#e5b869] text-[#121110] hover:bg-[#d4a758] disabled:opacity-60 disabled:cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : saved ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Salvar créditos
                </>
              )}
            </button>
          </div>
        </form>

        {/* Rodapé informativo */}
        <div className="border-t border-[#382f23]/40 px-5 py-3">
          <p className="text-[0.65rem] text-[#6e6355]">
            Salvo no Supabase · Cache público de 5 min · Visível a todos os leitores
          </p>
        </div>
      </div>
    </div>
  );
}
