import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { AudioLines, Sparkles, BookOpenCheck, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";

export default function PricingPage() {
    const { t } = useTranslation();
    const { isPro, loading, checkout } = useSubscription();
    const { user } = useAuth();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const handleSubscribeClick = async () => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        setIsCheckingOut(true);
        try {
            await checkout();
        } catch (err: any) {
            console.error(err);
            alert("Erro ao iniciar o checkout: " + err.message);
            setIsCheckingOut(false);
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
                        Experimente a Palavra com <br className="hidden sm:block" />
                        <span className="italic text-gold">Profundidade Inédita</span>
                    </h1>
                    <p className="text-lg text-app-text-muted">
                        Eleve seu estudo bíblico com ferramentas criadas para transformar a forma como você lê, escuta e interage com as Escrituras.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
                    {/* Features List */}
                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                                <AudioLines className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Áudio com Voz Humana Real</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Ouça os capítulos narrados com precisão e emoção cristalina pela tecnologia da ElevenLabs. Sem vozes robóticas, apenas uma narração profunda e natural.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                <Sparkles className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-app-text mb-2">Análise Teológica Ilimitada</h3>
                                <p className="text-app-text-muted text-sm leading-relaxed">
                                    Sem limites de mensagens diárias. Discuta teologia, contexto histórico e aplicações práticas de cada versículo profundamente com o seu assistente de estudo 24/7.
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

                    {/* Pricing Card */}
                    <div className="sticky top-24 bg-app-surface border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif text-app-text">Plano Premium</h3>
                            <div className="bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                                Mensal
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-5xl font-bold text-app-text tracking-tight">R$9,90</span>
                            <span className="text-app-text-muted ml-2">/mês</span>
                        </div>

                        <p className="text-sm text-app-text-muted mb-8 pb-8 border-b border-border/50">
                            Apenas R$0,33 por dia para financiar o desenvolvimento da plataforma e ter acesso a todas as ferramentas cristãs definitivas.
                        </p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Acesso a narrações em áudio realista</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Consultas e Pesquisas Teológicas Ilimitadas</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-app-text">
                                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                                <span>Backup em Nuvem e Planos Ilimitados</span>
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
                                <ShieldCheck className="w-5 h-5" /> Você já é Pro!
                            </div>
                        ) : (
                            <Button
                                onClick={handleSubscribeClick}
                                disabled={isCheckingOut}
                                className="w-full h-14 bg-gold hover:bg-gold2 text-[#141414] text-base font-bold transition-all shadow-lg hover:shadow-gold/20 rounded-xl"
                            >
                                {isCheckingOut ? "Redirecionando de forma segura..." : "Assinar Agora"}
                            </Button>
                        )}

                        <p className="text-center text-xs text-app-text-muted mt-6 flex items-center justify-center gap-1.5">
                            Cancelamento fácil e a qualquer momento.
                        </p>
                    </div>
                </div>
            </div>

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </Layout>
    );
}
