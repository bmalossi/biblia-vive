import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAllStudyData } from "@/hooks/useAllStudyData";
import { toast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Loader2, Crown, ShieldCheck, User, Lock, CreditCard, Monitor, Upload, BookOpen } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function passwordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ["", "Fraca", "Razoável", "Boa", "Forte"];
    const colors = ["", "bg-red-500", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
    return { score, label: labels[score] || "", color: colors[score] || "" };
}

function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ icon, title, children, id }: { icon: React.ReactNode; title: string; children: React.ReactNode; id?: string }) {
    return (
        <div id={id} className="bg-app-surface border border-border rounded-2xl p-6 space-y-5 scroll-mt-24">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-app-raised flex items-center justify-center text-gold">
                    {icon}
                </div>
                <h2 className="text-base font-semibold text-app-text">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function Alert({ type, message }: { type: "success" | "error"; message: string }) {
    return (
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {type === "success" ? <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <span>{message}</span>
        </div>
    );
}

// ─── AccountPage ──────────────────────────────────────────────────────────────

export default function AccountPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading, signOut } = useAuth();
    const { subscription, isPro, isTemplo, isAdmin, loading: subLoading, checkout, manageSubscription } = useSubscription();
    const { stats, loading: studyLoading } = useAllStudyData();

    // ── Personal Data ──
    const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [personalSaving, setPersonalSaving] = useState(false);

    // ── Password ──
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwSaving, setPwSaving] = useState(false);

    // ── Subscription ──
    const [subSaving, setSubSaving] = useState(false);

    // ── Church Settings ──
    const [churchName, setChurchName] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [churchSaving, setChurchSaving] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<string>("dados");

    useEffect(() => {
        if (!user) return;
        supabase
            .from('church_settings')
            .select('church_name, logo_url')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data) {
                    setChurchName(data.church_name ?? "");
                    setLogoUrl(data.logo_url ?? null);
                }
            });
    }, [user]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-app-bg">
                <Header />
                <main className="mx-auto max-w-2xl px-4 py-24 flex justify-center mt-20">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </main>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-app-bg">
                <Header />
                <main className="mx-auto max-w-2xl px-4 py-24 space-y-6 flex flex-col items-center justify-center mt-10">
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-app-text text-center">Acesso Restrito</h1>
                    <p className="text-app-text-muted text-center max-w-sm">
                        Você precisa estar logado para acessar a área da sua conta.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="mt-6 px-6 py-3 bg-app-raised hover:bg-gold/10 border border-border hover:border-gold/30 rounded-xl transition-colors font-medium text-app-text hover:text-gold"
                    >
                        Voltar para o Início
                    </button>
                </main>
            </div>
        );
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSaveName = async () => {
        setPersonalSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
            if (error) throw error;
            toast({ message: "Nome atualizado com sucesso!", type: "success" });
        } catch (err: any) {
            toast({ message: err.message || "Erro ao atualizar nome.", type: "error" });
        } finally {
            setPersonalSaving(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!email.includes("@")) {
            toast({ message: "Formato de e-mail inválido.", type: "error" });
            return;
        }
        setPersonalSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: email.trim() });
            if (error) throw error;
            toast({ message: "Um e-mail de confirmação foi enviado para o novo endereço.", type: "success" });
        } catch (err: any) {
            toast({ message: err.message || "Erro ao atualizar e-mail.", type: "error" });
        } finally {
            setPersonalSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPw.length < 8) {
            toast({ message: "A nova senha deve ter ao menos 8 caracteres.", type: "error" });
            return;
        }
        if (!/[0-9]/.test(newPw)) {
            toast({ message: "A nova senha deve conter ao menos um número.", type: "error" });
            return;
        }
        if (newPw !== confirmPw) {
            toast({ message: "As senhas não coincidem.", type: "error" });
            return;
        }

        setPwSaving(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: currentPw,
            });
            if (signInError) {
                toast({ message: "Senha atual incorreta.", type: "error" });
                return;
            }
            const { error } = await supabase.auth.updateUser({ password: newPw });
            if (error) throw error;
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
            toast({ message: "Senha alterada com sucesso!", type: "success" });
        } catch (err: any) {
            toast({ message: err.message || "Erro ao alterar senha.", type: "error" });
        } finally {
            setPwSaving(false);
        }
    };

    const handleManageSubscription = async () => {
        setSubSaving(true);
        try {
            await manageSubscription();
            // User will be redirected. The loading state can stay stuck on until redirect.
        } catch (err: any) {
            toast({ message: err.message || "Erro ao carregar o portal da assinatura.", type: "error" });
            setSubSaving(false);
        }
    };

    const strength = passwordStrength(newPw);
    const isLocalAdmin = (user?.app_metadata as any)?.role === "admin";
    const isActive = subscription?.status === "active" || subscription?.status === "trialing" || isPro || isTemplo;
    const isTemploActive = isLocalAdmin || (isActive && subscription?.plan_type === "templo");
    const isCancelingAtEnd = isActive && subscription?.cancel_at_period_end === true;
    const isCanceled = subscription?.status === "canceled";

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-app-bg">
            <Header />
            <main className="mx-auto max-w-2xl px-4 py-24 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-app-text">Minha Conta</h1>
                    <p className="text-sm text-app-text-muted mt-1">Gerencie seus dados e assinatura</p>
                </div>

                {/* ── Quick Navigation ── */}
                <nav className="sticky top-20 z-30 -mx-4 px-4 py-3 bg-app-bg/80 backdrop-blur-md border-b border-border sm:mx-0 sm:px-0 sm:rounded-xl sm:border sm:top-24">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {[
                            { id: "dados", label: "Dados", icon: <User className="h-3 w-3" /> },
                            { id: "seguranca", label: "Segurança", icon: <Lock className="h-3 w-3" /> },
                            { id: "plano", label: "Plano", icon: <CreditCard className="h-3 w-3" /> },
                            ...(isTemploActive ? [{ id: "igreja", label: "Modo Igreja", icon: <Monitor className="h-3 w-3" /> }] : []),
                            { id: "estudo", label: "Estudo", icon: <BookOpen className="h-3 w-3" /> }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border active:scale-95 whitespace-nowrap ${activeTab === item.id
                                    ? "bg-gold text-app-bg border-gold shadow-sm"
                                    : "text-app-text-muted border-transparent hover:text-gold hover:bg-gold/5 hover:border-gold/20"
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="relative min-h-[400px]">
                    {/* ── Personal Data ── */}
                    <div className={`transition-all duration-300 ${activeTab === 'dados' ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
                        <SectionCard id="dados" icon={<User className="h-4 w-4" />} title="Dados Pessoais">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-app-text-muted font-medium">Nome completo</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Seu nome"
                                            className="flex-1 bg-app-raised border-border"
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            disabled={personalSaving}
                                            className="px-4 py-2 text-xs font-medium bg-gold text-app-bg rounded-lg hover:bg-gold/90 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                                        >
                                            {personalSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-app-text-muted font-medium">E-mail</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="flex-1 bg-app-raised border-border"
                                        />
                                        <button
                                            onClick={handleSaveEmail}
                                            disabled={personalSaving || email === user.email}
                                            className="px-4 py-2 text-xs font-medium bg-gold text-app-bg rounded-lg hover:bg-gold/90 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                                        >
                                            {personalSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Security ── */}
                    <div className={`transition-all duration-300 ${activeTab === 'seguranca' ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
                        <SectionCard id="seguranca" icon={<Lock className="h-4 w-4" />} title="Segurança">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-app-text-muted font-medium">Senha atual</label>
                                    <Input
                                        type="password"
                                        value={currentPw}
                                        onChange={e => setCurrentPw(e.target.value)}
                                        placeholder="••••••••"
                                        className="bg-app-raised border-border"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-app-text-muted font-medium">Nova senha</label>
                                    <Input
                                        type="password"
                                        value={newPw}
                                        onChange={e => setNewPw(e.target.value)}
                                        placeholder="••••••••"
                                        className="bg-app-raised border-border"
                                    />
                                    {newPw.length > 0 && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex gap-1 flex-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-app-raised"}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-app-text-muted">{strength.label}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-app-text-muted font-medium">Confirmar nova senha</label>
                                    <Input
                                        type="password"
                                        value={confirmPw}
                                        onChange={e => setConfirmPw(e.target.value)}
                                        placeholder="••••••••"
                                        className="bg-app-raised border-border"
                                    />
                                </div>

                                <button
                                    onClick={handleChangePassword}
                                    disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                                    className="w-full py-2.5 text-sm font-medium bg-app-raised hover:bg-app-surface border border-border rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                >
                                    {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                    Alterar Senha
                                </button>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Subscription ── */}
                    <div className={`transition-all duration-300 ${activeTab === 'plano' ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
                        <SectionCard id="plano" icon={<CreditCard className="h-4 w-4" />} title="Gestão de Plano">
                            {subLoading ? (
                                <div className="flex items-center gap-2 text-sm text-app-text-muted">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Status display */}
                                    {isActive && !isCancelingAtEnd && (
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Crown className="h-4 w-4 text-gold" />
                                                    <span className="font-semibold text-gold text-sm">
                                                        {isLocalAdmin ? "Acesso Total (Admin)" : isTemploActive ? "Plano Templo" : "Plano PRO"}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-app-text-muted mt-1">
                                                    {isLocalAdmin ? "Acesso Premium Vitalício" : `Renova em ${formatDate(subscription?.current_period_end ?? null)}`}
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20 rounded-full">Ativo</span>
                                        </div>
                                    )}

                                    {isCancelingAtEnd && (
                                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                                <span className="text-sm font-medium text-yellow-400">Cancelamento agendado</span>
                                            </div>
                                            <p className="text-xs text-app-text-muted">Você mantém acesso PRO até <strong>{formatDate(subscription?.current_period_end ?? null)}</strong>.</p>
                                        </div>
                                    )}

                                    {(isCanceled || subscription?.status === "none" || (!isActive && !isCanceled)) && !isCancelingAtEnd && (
                                        <div className="p-4 rounded-xl bg-app-raised border border-border">
                                            <p className="text-sm text-app-text-muted">
                                                {isCanceled ? "Sua assinatura PRO foi cancelada." : "Você ainda não tem uma assinatura PRO."}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {!isActive && (
                                        <button
                                            onClick={() => checkout("pro")}
                                            disabled={subSaving}
                                            className="w-full py-3 text-sm font-semibold bg-gold text-app-bg rounded-xl hover:bg-gold/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Crown className="h-4 w-4" />
                                            {isCanceled ? "Retomar Assinatura PRO" : "Assinar PRO"}
                                        </button>
                                    )}

                                    {isActive && !isCancelingAtEnd && !isLocalAdmin && (
                                        <button
                                            onClick={handleManageSubscription}
                                            disabled={subSaving}
                                            className="w-full py-2.5 text-sm text-app-text-muted border border-border rounded-xl hover:bg-app-surface hover:text-app-text transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {subSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerenciar assinatura"}
                                        </button>
                                    )}

                                    {isCancelingAtEnd && (
                                        <button
                                            onClick={() => checkout("pro")}
                                            className="w-full py-3 text-sm font-semibold bg-gold text-app-bg rounded-xl hover:bg-gold/90 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Crown className="h-4 w-4" />
                                            Retomar Assinatura PRO
                                        </button>
                                    )}
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    {/* Church Mode Settings — Templo only */}
                    {isTemplo && (
                        <div className={`transition-all duration-300 ${activeTab === 'igreja' ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
                            <SectionCard id="igreja" icon={<Monitor className="h-4 w-4" />} title="Modo Igreja — Configurações do Telão">
                                <p className="text-xs text-app-text-muted -mt-2">Personalize a tela de espera que aparece no telão antes de projetar.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-app-text-muted mb-1.5">Nome da Igreja</label>
                                        <Input
                                            value={churchName}
                                            onChange={(e) => setChurchName(e.target.value)}
                                            placeholder="Ex: Igreja Batista Central"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-app-text-muted mb-1.5">Logotipo da Igreja</label>
                                        {logoUrl && (
                                            <div className="mb-3 flex items-center gap-3">
                                                <img src={logoUrl} alt="Logo atual" className="h-14 w-auto object-contain rounded border border-border" />
                                                <button
                                                    type="button"
                                                    onClick={() => setLogoUrl(null)}
                                                    className="text-xs text-red-400 hover:underline"
                                                >
                                                    Remover logo
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file || !user) return;
                                                setLogoUploading(true);
                                                try {
                                                    const ext = file.name.split('.').pop();
                                                    const path = `${user.id}/logo.${ext}`;
                                                    const { error: upErr } = await supabase.storage
                                                        .from('church-logos')
                                                        .upload(path, file, { upsert: true });
                                                    if (upErr) throw upErr;
                                                    const { data: urlData } = supabase.storage
                                                        .from('church-logos')
                                                        .getPublicUrl(path);
                                                    setLogoUrl(urlData.publicUrl + '?t=' + Date.now());
                                                } catch (err: any) {
                                                    toast({ message: 'Erro ao enviar logo: ' + err.message, type: 'error' });
                                                } finally {
                                                    setLogoUploading(false);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={logoUploading}
                                            className="flex items-center gap-2 text-sm border border-dashed border-border rounded-xl px-4 py-3 w-full hover:bg-app-raised transition-colors text-app-text-muted"
                                        >
                                            {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            {logoUploading ? 'Enviando...' : logoUrl ? 'Trocar logo' : 'Enviar logo (PNG, SVG ou JPG)'}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!user) return;
                                            setChurchSaving(true);
                                            try {
                                                const { error } = await supabase
                                                    .from('church_settings')
                                                    .upsert({ user_id: user.id, church_name: churchName, logo_url: logoUrl }, { onConflict: 'user_id' });
                                                if (error) throw error;
                                                toast({ message: 'Configurações salvas!', type: 'success' });
                                            } catch (err: any) {
                                                toast({ message: err.message, type: 'error' });
                                            } finally {
                                                setChurchSaving(false);
                                            }
                                        }}
                                        disabled={churchSaving}
                                        className="w-full py-2.5 text-sm font-semibold bg-gold text-app-bg rounded-xl hover:bg-gold/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {churchSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar configurações'}
                                    </button>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* ── My Study ── */}
                    <div className={`transition-all duration-300 ${activeTab === 'estudo' ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
                        <SectionCard id="estudo" icon={<BookOpen className="h-4 w-4" />} title="Meu Estudo">
                            {studyLoading ? (
                                <div className="flex items-center gap-2 text-sm text-app-text-muted">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                                </div>
                            ) : stats.totalNotes === 0 && stats.totalHighlights === 0 ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-app-text-muted">
                                        Comece a anotar seus versículos favoritos.
                                    </p>
                                    <button
                                        onClick={() => navigate('/meu-estudo')}
                                        className="text-[0.78rem] text-gold hover:text-gold/80 transition-colors"
                                    >
                                        Ver painel de estudo →
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-app-text-muted">
                                        <span className="font-medium text-app-text">{stats.totalNotes}</span> anotações ·{' '}
                                        <span className="font-medium text-app-text">{stats.totalHighlights}</span> destaques em{' '}
                                        <span className="font-medium text-app-text">{stats.booksCount}</span>{' '}
                                        {stats.booksCount === 1 ? 'livro bíblico' : 'livros bíblicos'}
                                    </p>
                                    <button
                                        onClick={() => navigate('/meu-estudo')}
                                        className="text-[0.78rem] text-gold hover:text-gold/80 transition-colors"
                                    >
                                        Ver painel de estudo →
                                    </button>
                                </div>
                            )}
                        </SectionCard>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-2">
                    <button
                        onClick={() => signOut().then(() => navigate("/"))}
                        className="text-xs text-app-text-muted hover:text-red-400 transition-colors"
                    >
                        Sair da conta
                    </button>
                </div>
            </main>
        </div>
    );
}
