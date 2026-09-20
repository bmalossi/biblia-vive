// ─────────────────────────────────────────────────────────────────────────────
// AdminConfiguracoesPage.tsx — Configurações Administrativas do Sistema e IA
// Bíblia Vive — Acesso restrito para administradores (role = 'admin')
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import AdminNav from "@/components/AdminNav";
import {
    Sliders,
    Sparkles,
    Loader2,
    LogIn,
    XCircle,
    CheckCircle2,
    AlertTriangle,
    Mic,
    Volume2,
    RefreshCw,
    Database,
    ShieldAlert,
    Info,
    Network,
    Lock,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useVoiceSettings } from "@/lib/voiceSettings";
import {
    getScriptureThreadConfig,
    updateScriptureThreadConfig,
    type ScriptureThreadConfig,
    DEFAULT_SCRIPTURE_THREAD_CONFIG,
} from "@/lib/appConfig";
import { toast } from "sonner";

interface HealthStatus {
    status: string;
    assemblyai_configured: boolean;
    assemblyai_key_prefix: string | null;
    r2_configured: boolean;
    r2_key_prefix: string | null;
    r2_endpoint: string;
    r2_bucket: string;
}

export default function AdminConfiguracoesPage() {
    usePageMeta({
        title: "Configurações — Admin Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const { isFallbackDisabled, isFallbackEnabled, toggleFallback } = useVoiceSettings();

    const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
    const [checkingHealth, setCheckingHealth] = useState(false);

    const [threadConfig, setThreadConfig] = useState<ScriptureThreadConfig>(DEFAULT_SCRIPTURE_THREAD_CONFIG);
    const [loadingThreadConfig, setLoadingThreadConfig] = useState(true);
    const [savingThreadKey, setSavingThreadKey] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsAdmin(false);
            return;
        }
        const meta = user.app_metadata as Record<string, unknown>;
        setIsAdmin(meta?.role === "admin");
    }, [user, authLoading]);

    const checkApiHealth = async () => {
        setCheckingHealth(true);
        try {
            const res = await fetch("/api/stt?action=health");
            if (!res.ok) {
                throw new Error(`Servidor respondeu com status ${res.status}`);
            }
            const data: HealthStatus = await res.json();
            setHealthStatus(data);
            toast.success("Diagnóstico concluído com sucesso!");
        } catch (err: any) {
            console.error("Erro ao checar integridade do STT:", err);
            toast.error(err.message || "Erro ao consultar integridade da API.");
        } finally {
            setCheckingHealth(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            checkApiHealth();
            getScriptureThreadConfig(true).then((cfg) => {
                setThreadConfig(cfg);
                setLoadingThreadConfig(false);
            });
        }
    }, [isAdmin]);

    const handleToggleThreadEnabled = async () => {
        const next = !threadConfig.enabled;
        setThreadConfig((prev) => ({ ...prev, enabled: next }));
        setSavingThreadKey("enabled");
        const res = await updateScriptureThreadConfig({ enabled: next });
        setSavingThreadKey(null);
        if (res.success) {
            toast.success(next ? "Fio da Escritura (JEV) ativado globalmente!" : "Fio da Escritura (JEV) desativado globalmente.");
        } else {
            setThreadConfig((prev) => ({ ...prev, enabled: !next }));
            toast.error(`Erro ao salvar no banco: ${res.error}`);
        }
    };

    const handleGranularityChange = async (granularity: "chapter" | "verse") => {
        const prev = threadConfig.granularity;
        setThreadConfig((p) => ({ ...p, granularity }));
        setSavingThreadKey("granularity");
        const res = await updateScriptureThreadConfig({ granularity });
        setSavingThreadKey(null);
        if (res.success) {
            toast.success(`Granularidade alterada para: ${granularity === "chapter" ? "Por Capítulo" : "Por Versículo"}`);
        } else {
            setThreadConfig((p) => ({ ...p, granularity: prev }));
            toast.error(`Erro ao salvar no banco: ${res.error}`);
        }
    };

    const handleMaxNotesChange = async (val: number) => {
        if (isNaN(val) || val < 5 || val > 100) return;
        const prev = threadConfig.maxNotes;
        setThreadConfig((p) => ({ ...p, maxNotes: val }));
        setSavingThreadKey("maxNotes");
        const res = await updateScriptureThreadConfig({ maxNotes: val });
        setSavingThreadKey(null);
        if (res.success) {
            toast.success(`Limite de notas ajustado para ${val}`);
        } else {
            setThreadConfig((p) => ({ ...p, maxNotes: prev }));
            toast.error(`Erro ao salvar no banco: ${res.error}`);
        }
    };

    const handleToggleRequirePro = async () => {
        const next = !threadConfig.requirePro;
        setThreadConfig((p) => ({ ...p, requirePro: next }));
        setSavingThreadKey("requirePro");
        const res = await updateScriptureThreadConfig({ requirePro: next });
        setSavingThreadKey(null);
        if (res.success) {
            toast.success(next ? "Fio da Escritura restrito a usuários PRO/Templo." : "Fio da Escritura liberado para todos os leitores.");
        } else {
            setThreadConfig((p) => ({ ...p, requirePro: !next }));
            toast.error(`Erro ao salvar no banco: ${res.error}`);
        }
    };

    const handleToggleFallback = () => {
        toggleFallback();
        if (isFallbackEnabled) {
            toast.warning("Fallback de Web Speech desativado. Modo Estrito (AssemblyAI exclusivo) ativo.");
        } else {
            toast.success("Fallback de Web Speech ativado para segurança.");
        }
    };

    if (authLoading || isAdmin === null) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
                    <Sparkles className="h-10 w-10 text-gold" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Área Restrita</h1>
                        <p className="mt-2 text-sm text-app-text-muted">
                            Faça login com uma conta de administrador para acessar as configurações.
                        </p>
                    </div>
                    <button
                        onClick={() => setAuthModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-transparent px-6 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold-bg"
                    >
                        <LogIn className="h-4 w-4" />
                        Fazer Login
                    </button>
                    <AuthModal
                        isOpen={authModalOpen}
                        onClose={() => setAuthModalOpen(false)}
                        hint="Entre com sua conta de administrador."
                    />
                </div>
            </Layout>
        );
    }

    if (isAdmin === false) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <XCircle className="h-10 w-10 text-red-500/80" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Acesso Negado</h1>
                        <p className="mt-2 text-sm text-app-text-muted max-w-[300px]">
                            Seu usuário ({user.email}) não possui privilégios de administrador.
                        </p>
                    </div>
                    <Link to="/" className="mt-2 text-sm text-gold hover:underline">
                        Voltar para o Início
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mx-auto max-w-3xl space-y-8 py-8 px-4 sm:px-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                        <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Configurações do Sistema</h1>
                        <p className="mt-0.5 text-sm text-app-text-muted">
                            Parâmetros de inteligência artificial, transcrição e contingência
                        </p>
                    </div>
                </div>

                {/* Navegação Admin */}
                <AdminNav />

                {/* Card 1: Controle de Fallback de Voz */}
                <div className="rounded-2xl border border-border bg-app-surface p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Mic className="h-5 w-5 text-gold" />
                                <h2 className="font-serif text-lg font-semibold text-app-text">
                                    Transcrição por Voz (AssemblyAI)
                                </h2>
                            </div>
                            <p className="text-xs text-app-text-muted">
                                Gerencie o comportamento do pipeline de reconhecimento de fala no Memorial e notas.
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full px-3 py-1 text-xs font-medium border bg-gold/5 border-gold/30 text-gold">
                            <span className={`h-2 w-2 rounded-full ${isFallbackEnabled ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                            <span>{isFallbackEnabled ? "Fallback Ativado (Padrão)" : "Modo Estrito IA (Sem Fallback)"}</span>
                        </div>
                    </div>

                    {/* Toggle Principal */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4 transition-colors">
                        <div className="space-y-1.5 max-w-xl">
                            <label htmlFor="fallback-toggle" className="text-sm font-medium text-app-text cursor-pointer select-none">
                                Fallback para Web Speech (Reconhecimento do Navegador)
                            </label>
                            <p className="text-xs leading-relaxed text-app-text-muted">
                                {isFallbackEnabled ? (
                                    <span>
                                        <strong className="text-emerald-400">Ativado (Segurança):</strong> Se houver falha de rede ou da AssemblyAI, o áudio falado é salvo usando o texto reconhecido pelo navegador para que o usuário não perca a oração/reflexão.
                                    </span>
                                ) : (
                                    <span>
                                        <strong className="text-amber-400">Desativado (Modo Estrito de Auditoria):</strong> O sistema aceita <em>apenas</em> o texto de alta fidelidade da AssemblyAI (com pontuação e acentuação). Se houver qualquer falha, exibe o erro na tela sem mascarar com texto cru do navegador.
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Botão Switch */}
                        <div className="flex items-center shrink-0 pt-2 sm:pt-0">
                            <button
                                id="fallback-toggle"
                                type="button"
                                role="switch"
                                aria-checked={isFallbackEnabled}
                                onClick={handleToggleFallback}
                                className={`relative inline-flex h-7 w-13 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                                    isFallbackEnabled ? "bg-gold" : "bg-zinc-700"
                                }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-black shadow-md transition-transform duration-200 ${
                                        isFallbackEnabled ? "translate-x-7" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Alerta explicativo */}
                    <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-zinc-900/40 p-4 text-xs text-app-text-muted leading-relaxed">
                        <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-app-text">Como funciona o controle de qualidade?</p>
                            <p className="mt-1">
                                O Bíblia Vive usa um pipeline de áudio de alta clareza (Opus 48kHz com cancelamento de ruído).
                                Em modo normal, se o upload falhar, ele salva o texto do navegador como contingência. Ao desligar o interruptor acima, você força o sistema a usar estritamente a AssemblyAI ou falhar com aviso explícito.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card: Fio da Escritura (TypeSafe AI / JEV) */}
                <div className="rounded-2xl border border-border bg-app-surface p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Network className="h-5 w-5 text-gold" />
                                <h2 className="font-serif text-lg font-semibold text-app-text">
                                    Fio da Escritura (TypeSafe AI · JEV)
                                </h2>
                            </div>
                            <p className="text-xs text-app-text-muted">
                                Motor de inferência tipológica entre o capítulo lido e os Registros do Memorial do Leitor.
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full px-3 py-1 text-xs font-medium border bg-gold/5 border-gold/30 text-gold">
                            <span className={`h-2 w-2 rounded-full ${threadConfig.enabled ? "bg-emerald-500" : "bg-zinc-600"}`} />
                            <span>{threadConfig.enabled ? "Ativo Globalmente" : "Desativado"}</span>
                        </div>
                    </div>

                    {loadingThreadConfig ? (
                        <div className="flex items-center justify-center p-6 text-sm text-app-text-muted">
                            <Loader2 className="h-4 w-4 animate-spin text-gold mr-2" />
                            Carregando parâmetros do banco...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Toggle 1: Ativação Global */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4 transition-colors">
                                <div className="space-y-1 max-w-xl">
                                    <label htmlFor="thread-toggle" className="text-sm font-medium text-app-text cursor-pointer select-none">
                                        Ativação Global do Fio da Escritura
                                    </label>
                                    <p className="text-xs leading-relaxed text-app-text-muted">
                                        Quando desativado, o cliente e o servidor pulam completamente a avaliação JEV, garantindo zero chamadas e silêncio total no leitor.
                                    </p>
                                </div>
                                <div className="flex items-center shrink-0">
                                    <button
                                        id="thread-toggle"
                                        type="button"
                                        role="switch"
                                        aria-checked={threadConfig.enabled}
                                        onClick={handleToggleThreadEnabled}
                                        disabled={savingThreadKey === "enabled"}
                                        className={`relative inline-flex h-7 w-13 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                                            threadConfig.enabled ? "bg-gold" : "bg-zinc-700"
                                        } ${savingThreadKey === "enabled" ? "opacity-60 cursor-wait" : ""}`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-black shadow-md transition-transform duration-200 ${
                                                threadConfig.enabled ? "translate-x-7" : "translate-x-1"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Seletor 2: Granularidade */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4">
                                <div className="space-y-1 max-w-xl">
                                    <span className="text-sm font-medium text-app-text">
                                        Granularidade da Avaliação
                                    </span>
                                    <p className="text-xs leading-relaxed text-app-text-muted">
                                        {threadConfig.granularity === "chapter" ? (
                                            <span>
                                                <strong className="text-gold">Por Capítulo (Padrão):</strong> 1 única chamada econômica por leitura de capítulo. O Fio manifesta-se de forma discreta no rodapé.
                                            </span>
                                        ) : (
                                            <span>
                                                <strong className="text-amber-400">Por Versículo (Avançado):</strong> Avaliação granular versículo a versículo (maior consumo de cota JEV).
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-app-surface p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleGranularityChange("chapter")}
                                        disabled={savingThreadKey === "granularity"}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                            threadConfig.granularity === "chapter"
                                                ? "bg-gold text-black shadow-xs"
                                                : "text-app-text-muted hover:text-app-text"
                                        }`}
                                    >
                                        Por Capítulo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleGranularityChange("verse")}
                                        disabled={savingThreadKey === "granularity"}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                            threadConfig.granularity === "verse"
                                                ? "bg-gold text-black shadow-xs"
                                                : "text-app-text-muted hover:text-app-text"
                                        }`}
                                    >
                                        Por Versículo
                                    </button>
                                </div>
                            </div>

                            {/* Input 3: Teto de Notas (Seleção Híbrida) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4">
                                <div className="space-y-1 max-w-xl">
                                    <label htmlFor="thread-max-notes" className="text-sm font-medium text-app-text">
                                        Limite Máximo de Notas no Payload
                                    </label>
                                    <p className="text-xs leading-relaxed text-app-text-muted">
                                        Número máximo de anotações enviadas ao JEV após a Seleção Híbrida Tripla (15 recentes + 10 favoritas + 5 por afinidade).
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="thread-max-notes"
                                        type="number"
                                        min={5}
                                        max={60}
                                        step={5}
                                        value={threadConfig.maxNotes}
                                        onChange={(e) => handleMaxNotesChange(parseInt(e.target.value, 10))}
                                        disabled={savingThreadKey === "maxNotes"}
                                        className="w-20 rounded-lg border border-border bg-app-surface px-3 py-1.5 text-center text-sm font-medium text-app-text focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                                    />
                                    <span className="text-xs text-app-text-muted">notas</span>
                                </div>
                            </div>

                            {/* Toggle 4: Restrição PRO/Templo */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4">
                                <div className="space-y-1 max-w-xl">
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="h-3.5 w-3.5 text-gold" />
                                        <label htmlFor="thread-pro-toggle" className="text-sm font-medium text-app-text cursor-pointer select-none">
                                            Restrito a Assinantes PRO / Templo
                                        </label>
                                    </div>
                                    <p className="text-xs leading-relaxed text-app-text-muted">
                                        {threadConfig.requirePro
                                            ? "Apenas leitores com assinatura ativa ou administradores recebem as conexões tipológicas do JEV."
                                            : "Liberado para todos os leitores autenticados na plataforma (ideal para fase de testes de utilidade)."
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center shrink-0">
                                    <button
                                        id="thread-pro-toggle"
                                        type="button"
                                        role="switch"
                                        aria-checked={threadConfig.requirePro}
                                        onClick={handleToggleRequirePro}
                                        disabled={savingThreadKey === "requirePro"}
                                        className={`relative inline-flex h-7 w-13 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                                            threadConfig.requirePro ? "bg-gold" : "bg-zinc-700"
                                        } ${savingThreadKey === "requirePro" ? "opacity-60 cursor-wait" : ""}`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-black shadow-md transition-transform duration-200 ${
                                                threadConfig.requirePro ? "translate-x-7" : "translate-x-1"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Nota de Governança */}
                            <div className="flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/5 p-4 text-xs text-app-text-muted leading-relaxed">
                                <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-app-text">Persistência Global em app_config</p>
                                    <p className="mt-1">
                                        Todas as alterações acima são gravadas no Supabase com permissão administrativa e lidas tanto pelo leitor no navegador quanto pelas Vercel Functions sem necessidade de compilação ou deploy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card 2: Diagnóstico da Infraestrutura de Voz */}
                <div className="rounded-2xl border border-border bg-app-surface p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-gold" />
                            <h2 className="font-serif text-lg font-semibold text-app-text">
                                Diagnóstico da Infraestrutura
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={checkApiHealth}
                            disabled={checkingHealth}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${checkingHealth ? "animate-spin" : ""}`} />
                            <span>Verificar Conexão</span>
                        </button>
                    </div>

                    {healthStatus ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* AssemblyAI */}
                            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-app-text-muted uppercase tracking-wider">
                                        AssemblyAI (IA STT)
                                    </span>
                                    {healthStatus.assemblyai_configured ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Configurada
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
                                            <AlertTriangle className="h-3.5 w-3.5" /> Ausente
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-app-text">
                                    {healthStatus.assemblyai_configured ? `Chave Ativa (${healthStatus.assemblyai_key_prefix})` : "Chave ASSEMBLYAI_API_KEY não encontrada"}
                                </p>
                                <p className="text-[11px] text-app-text-muted">
                                    Modelos: Universal-3.5-pro / Universal-2 (pt-BR, pontuação ativa)
                                </p>
                            </div>

                            {/* Cloudflare R2 */}
                            <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-app-text-muted uppercase tracking-wider">
                                        Cloudflare R2 Storage
                                    </span>
                                    {healthStatus.r2_configured ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Configurado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                            <AlertTriangle className="h-3.5 w-3.5" /> Verificar Vercel
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-app-text">
                                    Bucket: {healthStatus.r2_bucket}
                                </p>
                                <p className="text-[11px] text-app-text-muted truncate" title={healthStatus.r2_endpoint}>
                                    Endpoint: {healthStatus.r2_endpoint.replace(/^https?:\/\//, "")}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-6 text-sm text-app-text-muted">
                            <Loader2 className="h-4 w-4 animate-spin text-gold mr-2" />
                            Consultando diagnóstico...
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
