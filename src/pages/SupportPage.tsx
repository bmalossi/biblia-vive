import Layout from "@/components/Layout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTranslation } from "@/i18n";
import { Heart, Server, Code, Coffee, HelpCircle, Copy, Check, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // Assuming sonner is used for toasts based on ToastViewport elsewhere, or I can use a generic success message.
import { Button } from "@/components/ui/button"; // Assuming standard ui setup

export default function SupportPage() {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    // Mock PIX key for demonstration, should be replaced with real key/QR
    const PIX_KEY = "suporte@bibliavive.com.br";

    usePageMeta({
        title: "Apoie a Bíblia Vive | Contribua com nosso projeto missionário",
        description: "A Bíblia Vive é uma plataforma 99% gratuita. Apoie nosso projeto com doações voluntárias e ajude o desenvolvedor a manter a Palavra de Deus acessível a todos.",
        canonical: "/apoiar",
        jsonLd: [
            {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Apoie a Bíblia Vive",
                "url": `${window.location.origin}/apoiar`,
            }
        ]
    });

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        setCopied(true);
        // Fallback toast if setup allows
        try { toast.success("Chave PIX copiada!"); } catch (e) { }
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Layout>
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <Heart className="h-12 w-12 text-gold mx-auto mb-4" />
                    <h1 className="text-4xl font-serif text-app-text mb-4">Seja Parceiro da Missão Bíblia Vive</h1>
                    <p className="text-xl text-app-text-muted max-w-2xl mx-auto">
                        O site é 99% gratuito (com o alvo de chegarmos a 100%). Seu apoio voluntário permite que o desenvolvedor tenha foco total no projeto, arcando com os custos e construindo novas ferramentas para espalhar a Palavra de Deus.
                    </p>
                    <div className="mt-8 p-4 bg-app-surface border border-border rounded-xl inline-block text-left text-sm text-app-text-muted italic max-w-lg mx-auto">
                        "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." — 2 Coríntios 9:7
                    </div>
                </div>

                {/* Transparência */}
                <section className="mb-16">
                    <h2 className="text-2xl font-serif text-app-text mb-8 text-center">Onde os recursos são investidos?</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="bg-app-surface border border-border p-6 rounded-2xl flex flex-col items-center text-center">
                            <Server className="h-8 w-8 text-gold mb-4" />
                            <h3 className="text-lg font-serif text-app-text mb-2">Hospedagem e Servidores</h3>
                            <p className="text-sm text-app-text-muted">
                                Manter nossos bancos de dados e servidores no ar de forma rápida e segura para milhares de leitores diários.
                            </p>
                        </div>
                        <div className="bg-app-surface border border-border p-6 rounded-2xl flex flex-col items-center text-center">
                            <Code className="h-8 w-8 text-gold mb-4" />
                            <h3 className="text-lg font-serif text-app-text mb-2">Melhorias e Ferramentas</h3>
                            <p className="text-sm text-app-text-muted">
                                Desenvolvimento de novos planos de leitura, áudios e recursos para enriquecer ainda mais o seu devocional.
                            </p>
                        </div>
                        <div className="bg-app-surface border border-border p-6 rounded-2xl flex flex-col items-center text-center">
                            <Coffee className="h-8 w-8 text-gold mb-4" />
                            <h3 className="text-lg font-serif text-app-text mb-2">Sustento da Equipe</h3>
                            <p className="text-sm text-app-text-muted">
                                Apoiando e abençoando as horas de dedicação técnica do desenvolvedor e equipe que mantém o projeto vivo.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Doação */}
                <section className="bg-app-raised border border-border p-8 rounded-3xl mb-16 shadow-sm">
                    <h2 className="text-3xl font-serif text-app-text mb-6 text-center">Escolha como abençoar</h2>

                    <div className="flex flex-col items-center max-w-sm mx-auto">
                        <div className="w-full bg-app-surface p-6 rounded-2xl border border-border text-center flex flex-col items-center shadow-sm hover:border-gold/30 transition-colors">
                            <QrCode className="h-10 w-10 text-gold mb-4" />
                            <h3 className="text-xl font-medium text-app-text mb-2">Doação Voluntária (PIX)</h3>
                            <p className="text-sm text-app-text-muted mb-6">Abençoe com o valor que Deus colocar no seu coração e que não comprometa seu orçamento.</p>

                            {/* Placeholder para QR Code */}
                            {/* <div className="bg-white p-2 rounded-xl mb-4">
                                <img src="/pix-qr.png" alt="QR Code Pix" className="w-32 h-32" />
                            </div> */}

                            <div className="w-full mt-auto">
                                <div className="text-xs text-app-text-muted mb-2 font-mono break-all bg-app-background p-2 rounded border border-border">
                                    {PIX_KEY}
                                </div>
                                <Button
                                    onClick={handleCopyPix}
                                    className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-hover text-app-background font-medium"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "Chave Copiada!" : "Copiar Chave PIX"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <HelpCircle className="h-6 w-6 text-gold" />
                        <h2 className="text-2xl font-serif text-app-text">Perguntas Frequentes</h2>
                    </div>

                    <div className="space-y-4 max-w-2xl mx-auto">
                        <div className="bg-app-surface p-5 rounded-2xl border border-border">
                            <h4 className="font-medium text-app-text mb-2">O site nunca será 100% gratuito?</h4>
                            <p className="text-sm text-app-text-muted">Nosso objetivo é que sim! Hoje, oferecemos planos de assinatura adicionais de valor simbólico (para comentários teológicos avançados e projeção nas igrejas), porque o acesso a essas integrações possui um custo real de API pago pelos próprios desenvolvedores. Com o suficiente apoio voluntário dos irmãos, sonhamos em tornar todas as funcionalidades da Bíblia Vive 100% gratuitas para todos sem interrupções.</p>
                        </div>
                        <div className="bg-app-surface p-5 rounded-2xl border border-border">
                            <h4 className="font-medium text-app-text mb-2">É seguro doar usando a chave PIX?</h4>
                            <p className="text-sm text-app-text-muted">Sim, a chave PIX informada é vinculada à conta do desenvolvedor responsável pela plataforma.</p>
                        </div>
                        <div className="bg-app-surface p-5 rounded-2xl border border-border">
                            <h4 className="font-medium text-app-text mb-2">Posso ajudar de outra forma?</h4>
                            <p className="text-sm text-app-text-muted">Com certeza! Você pode nos ajudar imensamente compartilhando o projeto com sua igreja, amigos e, acima de tudo, incluindo o nosso ministério e desenvolvedores em suas orações.</p>
                        </div>
                    </div>
                </section>

                <div className="text-center mt-12 bg-app-surface/50 py-6 rounded-2xl">
                    <p className="text-gold italic font-serif text-lg">Deus os abençoe rica e abundantemente.</p>
                </div>
            </div>
        </Layout>
    );
}
