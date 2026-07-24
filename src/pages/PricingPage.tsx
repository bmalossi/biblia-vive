import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { AudioLines, Sparkles, BookOpenCheck, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import PricingComparison from "@/components/PricingComparison";

export default function PricingPage() {
    usePageMeta({
        title: "Apoie a Missão — Bíblia Vive PRO",
        description: "A leitura da Palavra é gratuita. Ao apoiar a Bíblia Vive, você sustenta a missão e disponibiliza ferramentas avançadas para aprofundamento dos estudos.",
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
                        Bíblia Vive PRO
                    </h2>
                    <h1 className="font-serif text-4xl sm:text-5xl text-app-text mb-6">
                        Apoie a missão <br className="hidden sm:block" />
                        <span className="italic text-gold">da Bíblia Vive</span>
                    </h1>
                    <p className="text-lg text-app-text-muted leading-relaxed">
                        A leitura da Palavra permanecerá gratuita. Ao apoiar a Bíblia Vive, você ajuda essa missão a permanecer e ainda desbloqueia ferramentas para aprofundar seus estudos.
                    </p>
                </div>

                {/* Pricing Cards - Moved to Top */}
                <div className="max-w-5xl mx-auto grid lg:grid-cols-3 md:grid-cols-1 gap-6 items-start mb-8">
                    {/* Card Gratuito */}
                    <div className="bg-app-surface border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-slate-500/5 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif text-app-text">Acesso Gratuito</h3>
                            <div className="relative flex items-center gap-2 px-3 pt-1.5 pb-1 bg-gradient-to-r from-[#2c2c2e] to-[#1c1c1e] border border-[#3a3a3c] rounded-md shadow-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8e8e93] animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d1d1d6]">
                                    Livre
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-5xl font-bold text-app-text tracking-tight">R$0,00</span>
                        </div>

                        <p className="text-sm text-app-text-muted mb-8 pb-8 border-b border-border/50">
                            Leia a Bíblia gratuitamente, acompanhe sua leitura, registre suas reflexões e cultive uma rotina diária com as Escrituras.
                        </p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                <span>Acesso completo a todos os livros e versículos</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                <span>Busca por palavra e referência</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text text-app-text-muted">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500/50 flex-shrink-0" />
                                <span>Acompanhamento de leitura e caderno pessoal</span>
                            </li>
                        </ul>

                        {!user ? (
                            <Button
                                onClick={() => setAuthModalOpen(true)}
                                className="w-full h-14 bg-app-raised hover:bg-app-raised/80 text-app-text font-bold transition-all shadow-md rounded-xl text-base"
                            >
                                Criar Conta Grátis
                            </Button>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium">
                                <ShieldCheck className="w-5 h-5" /> Conta Ativa
                            </div>
                        )}
                    </div>

                    {/* Card PRO */}
                    <div className="bg-app-surface border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif text-app-text">Plano <br />PRO</h3>
                            <div className="relative flex items-center gap-2 px-3 pt-1.5 pb-1 bg-gradient-to-r from-[#443818] to-[#2c240f] border border-[#685623] rounded-md shadow-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#e5c158] animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fbf0cd]">
                                    Apoio
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-5xl font-bold text-app-text tracking-tight">R$4,90</span>
                            <span className="text-app-text-muted ml-2">/mês</span>
                        </div>

                        <p className="text-sm text-app-text-muted mb-8 pb-8 border-b border-border/50">
                            Para quem deseja aprofundar seus estudos e, ao mesmo tempo, sustentar o desenvolvimento contínuo da Bíblia Vive.
                        </p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Consultas a Comentários Teológicos históricos</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Narrações em áudio para acompanhar a leitura</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Apoio direto à continuidade da missão</span>
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
                                {isCheckingOut === 'pro' ? "Redirecionando de forma segura..." : "Apoiar com Plano PRO"}
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
                                    Igrejas
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-5xl font-bold text-app-text tracking-tight">R$19,90</span>
                            <span className="text-app-text-muted ml-2">/mês</span>
                        </div>

                        <p className="text-sm text-app-text-muted mb-8 pb-8 border-b border-border/50">
                            Desenvolvido para igrejas que desejam utilizar a Bíblia Vive em cultos, estudos e encontros.
                        </p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Recursos do Plano PRO inclusos</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Ferramentas de projeção para cultos e reuniões</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Visuais adaptados para telas de alto contraste</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                                <span>Apoio comunitário ao desenvolvimento da plataforma</span>
                            </li>
                        </ul>

                        {loading ? (
                            <Button className="w-full h-14 bg-app-raised font-semibold rounded-xl" disabled>
                                Carregando...
                            </Button>
                        ) : isTemplo ? (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium">
                                <ShieldCheck className="w-5 h-5" /> Plano Ativo!
                            </div>
                        ) : (
                            <Button
                                onClick={() => handleSubscribeClick('templo')}
                                disabled={isCheckingOut !== null}
                                className={`w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-lg hover:shadow-violet-500/20 rounded-xl px-2 ${isCheckingOut === 'templo' ? 'text-xs sm:text-sm whitespace-normal leading-tight' : 'text-base'}`}
                            >
                                {isCheckingOut === 'templo' ? "Redirecionando de forma segura..." : "Apoiar com Plano Templo"}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="text-center mt-6 mb-12">
                    <p className="text-xs text-app-text-muted">
                        Cancelamento simples a qualquer momento.
                    </p>
                </div>

                {/* Plan Comparison Section */}
                <PricingComparison />

                {/* Features List - Moved to Bottom */}
                <div className="mt-20 max-w-5xl mx-auto border-t border-border/50 pt-16">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl text-app-text">Recursos de Aprofundamento</h2>
                        <p className="text-app-text-muted mt-2">Ferramentas criadas para favorecer o estudo e a permanência nas Escrituras</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                                <AudioLines className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Narrações em Áudio</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Continue sua leitura mesmo quando não puder acompanhar o texto visualmente, ouvindo os capítulos com clareza.
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
                                    Consulte interpretações históricas e comentários cristãos reconhecidos para compreender melhor o contexto das Escrituras durante seus estudos.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                <BookOpenCheck className="h-5 w-5 text-teal-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Planos de Leitura</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Organize uma rotina consistente de permanência na Palavra conforme sua realidade pessoal.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Download className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Preservação em PDF</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Preserve suas anotações, reflexões e estudos para consulta futura e registro pessoal.
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
