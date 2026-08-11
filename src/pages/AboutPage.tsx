import Layout from "@/components/Layout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTranslation } from "@/i18n";
import { Info, BookOpen, ShieldCheck } from "lucide-react";

export default function AboutPage() {
    const { t } = useTranslation();

    usePageMeta({
        title: t("about.title", { defaultValue: "Sobre o Bíblia Vive — Missão e Propósito | Bíblia Vive" }),
        description: t("about.desc", { defaultValue: "Entenda a missão do Bíblia Vive: fornecer estudos e leituras bíblicas com as melhores traduções mantendo altíssima fidedignidade aos textos sagrados clássicos." }),
        canonical: "/sobre",
        jsonLd: [
            {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": `${window.location.origin}#organization`,
                "name": t("app.name"),
                "url": window.location.origin,
                "logo": `${window.location.origin}/og/home.png`,
                "description": "Uma plataforma dedicada ao estudo das escrituras sagradas mantendo fidelidade às traduções clássicas da Bíblia.",
                "sameAs": [
                    "https://www.instagram.com/biblia.vive/",
                    "https://www.facebook.com/bibliavive/"
                ],
            },
            {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "@id": `${window.location.origin}/sobre#webpage`,
                "url": `${window.location.origin}/sobre`,
                "name": "Sobre o Bíblia Vive",
                "isPartOf": {
                    "@type": "WebSite",
                    "@id": `${window.location.origin}#website`,
                    "name": "Bíblia Vive",
                    "url": window.location.origin,
                },
                "about": {
                    "@type": "Organization",
                    "@id": `${window.location.origin}#organization`,
                },
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Início", "item": window.location.origin },
                    { "@type": "ListItem", "position": 2, "name": "Sobre", "item": `${window.location.origin}/sobre` }
                ]
            }
        ]
    });

    return (
        <Layout>
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-serif text-app-text mb-4">Sobre o Bíblia Vive</h1>
                <p className="text-lg text-app-text-muted mb-12">
                    Conheça nosso compromisso com a fidedignidade nas Escrituras e nosso propósito tecnológico.
                </p>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-app-surface border border-border p-6 rounded-2xl">
                        <Info className="h-8 w-8 text-gold mb-4" />
                        <h3 className="text-xl font-serif text-app-text mb-2">Nossa Missão</h3>
                        <p className="text-sm text-app-text-muted">
                            Levar a palavra de Deus com ferramentas modernas sem perder a essência milenar. O <em>Bíblia Vive</em> foi construído para potencializar o estudo devocional individual e em igreja, unindo tecnologia de ponta (como nosso Acervo Teológico) e reverência.
                        </p>
                    </div>

                    <div className="bg-app-surface border border-border p-6 rounded-2xl">
                        <BookOpen className="h-8 w-8 text-gold mb-4" />
                        <h3 className="text-xl font-serif text-app-text mb-2">Traduções e Fidedignidade</h3>
                        <p className="text-sm text-app-text-muted">
                            Utilizamos consagradas versões da Bíblia, prezando pelo E-E-A-T (Qualidade técnica e fidedignidade). Oferecemos traduções no domínio público como a Almeida Corrigida Fiel (ACF) demonstrando nosso rígido compromisso com os originais e respeito aos detentores de direitos autorais de licenças como NVI.
                        </p>
                    </div>

                    <div className="bg-app-surface border border-border p-6 rounded-2xl">
                        <ShieldCheck className="h-8 w-8 text-gold mb-4" />
                        <h3 className="text-xl font-serif text-app-text mb-2">Transparência</h3>
                        <p className="text-sm text-app-text-muted">
                            Não somos mantidos por nenhuma congregação denominacional específica. Somos uma plataforma cristã independente suportada em parte pelos assinantes do Bíblia Vive PRO.
                        </p>
                    </div>
                </div>

                <section className="mt-16 bg-app-raised p-8 rounded-2xl border border-border">
                    <h2 className="text-2xl font-serif text-app-text mb-4">A Importância das Referências</h2>
                    <p className="text-app-text-muted leading-relaxed mb-4">
                        Em tempos de inteligência artificial e geração de conteúdo massivo, a precisão da referência é indispensável para estudos em Teologia (YMYL - "Your Money or Your Life").
                    </p>
                    <p className="text-app-text-muted leading-relaxed">
                        Aqui, cada versículo, comentário bibliográfico e nota de rodapé são isolados para garantir que você tenha um conteúdo teológico altamente revisado.
                        Nestas entranhas técnicas asseguramos o rastreamento via JSON-LD e AI Overviews (GEO) da Google na certeza de prezar pela Verdade.
                    </p>
                </section>
            </div>
        </Layout>
    );
}
