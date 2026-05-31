import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { AudioLines, Sparkles, BookOpenCheck, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function PricingPage() {
    usePageMeta({
        title: "Bíblia Vive PRO — Planos de Assinatura",
        description: "Assine o Bíblia Vive PRO ou Templo e desbloqueie anotações ilimitadas, áudio-comentários com IA, exportações em PDF e muito mais.",
        canonical: "/pro",
    });

    const { t } = useTranslation();
    const { isPro, isTemplo, loading, checkout } = useSubscription();
    const { user } = useAuth();
    const [isCheckingOut, setIsCheckingOut] = useState<'pro' | 'templo' | null>(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const handleSubscribeClick = async (plan: 'pro' | 'templo') => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        setIsCheckingOut(plan);
        try {
            await checkout(plan);
        } catch (err: any) {
            console.error(err);
            alert("Erro ao iniciar o checkout: " + err.message);
            setIsCheckingOut(null);
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gold mb-3">
                        Bíblia Vive Pro
                    </h2>
                    <h1 className="font-serif text-4xl sm:text-5xl text-app-text mb-6">
                        Apoie o Projeto e <br className="hidden sm:block" />
                        <span className="italic text-gold">Espalhe a Palavra</span>
                    </h1>
                    <p className="text-lg text-app-text-muted">
                        Sua assinatura ajuda a sustentar o Bíblia Vive, avançar com novas missões e espalhar a Palavra de Deus. Como agradecimento, você desbloqueia comentários teológicos profundos e ferramentas avançadas de estudo.
                    </p>
                </div>

                {/* Pricing Cards - Moved to Top */}
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 items-start">
                    {/* Card PRO */}
                    <div className="bg-app-surface border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif text-app-text">Plano PRO</h3>
                            <div className="bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                                Mensal
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-5xl font-bold text-app-text tracking-tight">R$4,90</span>
                            <span className="text-app-text-muted ml-2">/mês</span>
                        </div>

                        <p className="text-sm text-app-text-muted mb-8 pb-8 border-b border-border/50">
                            Acesse ferramentas cristãs para o seu aprofundamento pessoal e devoção. Este valor ajudará nos custos envolvidos na busca e filtragem de comentários teológicos de 99% dos versículos da bíblia.
                        </p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Acesso a até 10 Comentários Teológicos por hora</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Acesso a narrações em áudio realista</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Selo Pro no perfil</span>
                            </li>
                        </ul>

                        {loading ? (
                            <Button className="w-full h-14 bg-app-raised font-semibold rounded-xl" disabled>
                                Carregando...
                            </Button>
                        ) : isPro ? (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium">
                                <ShieldCheck className="w-5 h-5" /> Plano Ativo!
                            </div>
                        ) : (
                            <Button
                                onClick={() => handleSubscribeClick('pro')}
                                disabled={isCheckingOut !== null}
                                className={`w-full h-14 bg-gold hover:bg-gold2 text-white font-bold transition-all shadow-lg hover:shadow-gold/20 rounded-xl px-2 ${isCheckingOut === 'pro' ? 'text-xs sm:text-sm whitespace-normal leading-tight' : 'text-base'}`}
                            >
                                {isCheckingOut === 'pro' ? "Redirecionando de forma segura..." : "Assinar Plano PRO"}
                            </Button>
                        )}
                    </div>

                    {/* Card Templo */}
                    <div className="bg-app-surface border border-violet-500/20 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif text-app-text">Plano Templo</h3>
                            <div className="relative flex items-center gap-2 px-3 pt-1.5 pb-1 bg-gradient-to-r from-[#242254] to-[#1a1845] border border-[#3b387e] rounded-md shadow-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#837dfa] animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e0deff]">
                                    Para Igrejas
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-5xl font-bold text-app-text tracking-tight">R$19,90</span>
                            <span className="text-app-text-muted ml-2">/mês</span>
                        </div>

                        <p className="text-sm text-app-text-muted mb-8 pb-8 border-b border-border/50">
                            Tudo do Plano PRO + Ferramentas avançadas para projeção em cultos e reuniões.
                        </p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Tudo o que está incluso no Plano PRO</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Recurso de Projeção em Telão Padrão Igreja</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Visuais adaptados para alto contraste</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Selo EXCLUSIVO "Templo" no perfil</span>
                            </li>
                        </ul>

                        {loading ? (
                            <Button className="w-full h-14 bg-app-raised font-semibold rounded-xl" disabled>
                                Carregando...
                            </Button>
                        ) : isTemplo ? (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium">
                                <ShieldCheck className="w-5 h-5" /> Plano Ativado!
                            </div>
                        ) : (
                            <Button
                                onClick={() => handleSubscribeClick('templo')}
                                disabled={isCheckingOut !== null}
                                className={`w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-lg hover:shadow-violet-500/20 rounded-xl px-2 ${isCheckingOut === 'templo' ? 'text-xs sm:text-sm whitespace-normal leading-tight' : 'text-base'}`}
                            >
                                {isCheckingOut === 'templo' ? "Redirecionando de forma segura..." : "Assinar Plano Templo"}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="text-center mt-6">
                    <p className="text-xs text-app-text-muted">
                        Cancelamento fácil e a qualquer momento.
                    </p>
                </div>

                {/* Features List - Moved to Bottom */}
                <div className="mt-20 max-w-5xl mx-auto border-t border-border/50 pt-16">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl text-app-text">Recursos Inclusos</h2>
                        <p className="text-app-text-muted mt-2">Visão detalhada de tudo o que sua assinatura oferece</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                                <AudioLines className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Áudio com Voz - Narração de Versículos</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Ouça os capítulos narrados com precisão e emoção cristalina. Sem vozes robóticas, apenas uma narração profunda e natural.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                <Sparkles className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Comentários Teológicos</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Tenha acesso a até 10 comentários explicativos por hora, de comentaristas teológicos renomados e históricos (Spurgeon, Adam Clark, etc) para se aprofundar na Palavra.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                <BookOpenCheck className="h-5 w-5 text-teal-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Planos de Leitura Avançados</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Acesse o catálogo completo de metodologias de leitura e crie cronogramas customizados moldados à sua rotina pessoal de devoção.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Download className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Exportações em PDF</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Exporte lindas brochuras em PDF com absolutamente todas as suas marcações, notas de rodapé e reflexões encadernadas digitalmente.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </Layout>
    );
}
