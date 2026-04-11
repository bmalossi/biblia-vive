import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertTriangle, Crown, ShieldCheck, User, Lock, CreditCard, Monitor, Upload } from "lucide-react";

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

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-app-surface border border-border rounded-2xl p-6 space-y-5">
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
    const { subscription, isPro, isTemplo, isAdmin, loading: subLoading, checkout, cancelSubscription } = useSubscription();

    // ── Personal Data ──
    const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [personalSaving, setPersonalSaving] = useState(false);
    const [personalMsg, setPersonalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // ── Password ──
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // ── Subscription ──
    const [subSaving, setSubSaving] = useState(false);
    const [subMsg, setSubMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    // ── Church Settings ──
    const [churchName, setChurchName] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [churchSaving, setChurchSaving] = useState(false);
    const [churchMsg, setChurchMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

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
        setPersonalMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
            if (error) throw error;
            setPersonalMsg({ type: "success", text: "Nome atualizado com sucesso!" });
        } catch (err: any) {
            setPersonalMsg({ type: "error", text: err.message || "Erro ao atualizar nome." });
        } finally {
            setPersonalSaving(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!email.includes("@")) {
            setPersonalMsg({ type: "error", text: "Formato de e-mail inválido." });
            return;
        }
        setPersonalSaving(true);
        setPersonalMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({ email: email.trim() });
            if (error) throw error;
            setPersonalMsg({ type: "success", text: "Um e-mail de confirmação foi enviado para o novo endereço." });
        } catch (err: any) {
            setPersonalMsg({ type: "error", text: err.message || "Erro ao atualizar e-mail." });
        } finally {
            setPersonalSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPwMsg(null);
        if (newPw.length < 8) {
            setPwMsg({ type: "error", text: "A nova senha deve ter ao menos 8 caracteres." });
            return;
        }
        if (!/[0-9]/.test(newPw)) {
            setPwMsg({ type: "error", text: "A nova senha deve conter ao menos um número." });
            return;
        }
        if (newPw !== confirmPw) {
            setPwMsg({ type: "error", text: "As senhas não coincidem." });
            return;
        }

        setPwSaving(true);
        try {
            // Verify current password first
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: currentPw,
            });
            if (signInError) {
                setPwMsg({ type: "error", text: "Senha atual incorreta." });
                return;
            }
            const { error } = await supabase.auth.updateUser({ password: newPw });
            if (error) throw error;
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
            setPwMsg({ type: "success", text: "Senha alterada com sucesso!" });
        } catch (err: any) {
            setPwMsg({ type: "error", text: err.message || "Erro ao alterar senha." });
        } finally {
            setPwSaving(false);
        }
    };

    const handleCancelSubscription = async () => {
        setShowConfirmCancel(false);
        setSubSaving(true);
        setSubMsg(null);
        try {
            await cancelSubscription();
            setSubMsg({ type: "success", text: "Assinatura cancelada. Você mantém acesso até o fim do período pago." });
        } catch (err: any) {
            setSubMsg({ type: "error", text: err.message || "Erro ao cancelar assinatura." });
        } finally {
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

                {/* ── Personal Data ── */}
                <SectionCard icon={<User className="h-4 w-4" />} title="Dados Pessoais">
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

                        {personalMsg && <Alert type={personalMsg.type} message={personalMsg.text} />}
                    </div>
                </SectionCard>

                {/* ── Security ── */}
                <SectionCard icon={<Lock className="h-4 w-4" />} title="Segurança">
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

                        {pwMsg && <Alert type={pwMsg.type} message={pwMsg.text} />}

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

                {/* ── Subscription ── */}
                <SectionCard icon={<CreditCard className="h-4 w-4" />} title="Gestão de Plano">
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

                            {subMsg && <Alert type={subMsg.type} message={subMsg.text} />}

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
                                    onClick={() => setShowConfirmCancel(true)}
                                    disabled={subSaving}
                                    className="w-full py-2.5 text-sm text-app-text-muted border border-border rounded-xl hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50 transition-colors"
                                >
                                    Cancelar assinatura
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

                {/* Church Mode Settings — Templo only */}
                {isTemplo && (
                    <SectionCard icon={<Monitor className="h-4 w-4" />} title="Modo Igreja — Configurações do Telão">
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
                                            setChurchMsg({ type: 'error', text: 'Erro ao enviar logo: ' + err.message });
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

                            {churchMsg && <Alert type={churchMsg.type} message={churchMsg.text} />}

                            <button
                                type="button"
                                onClick={async () => {
                                    if (!user) return;
                                    setChurchSaving(true);
                                    setChurchMsg(null);
                                    try {
                                        const { error } = await supabase
                                            .from('church_settings')
                                            .upsert({ user_id: user.id, church_name: churchName, logo_url: logoUrl }, { onConflict: 'user_id' });
                                        if (error) throw error;
                                        setChurchMsg({ type: 'success', text: 'Configurações salvas!' });
                                    } catch (err: any) {
                                        setChurchMsg({ type: 'error', text: err.message });
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
                )}

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

            {/* ── Cancel Confirmation Modal ── */}
            {showConfirmCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-app-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-app-text">Cancelar assinatura?</h3>
                                <p className="text-xs text-app-text-muted mt-0.5">Você mantém o acesso PRO até o final do período já pago.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirmCancel(false)}
                                className="flex-1 py-2.5 text-sm border border-border rounded-xl hover:bg-app-raised transition-colors"
                            >
                                Manter plano
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                disabled={subSaving}
                                className="flex-1 py-2.5 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                            >
                                {subSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sim, cancelar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
