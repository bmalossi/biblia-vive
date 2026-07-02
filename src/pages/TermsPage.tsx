import Layout from "@/components/Layout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTranslation } from "@/i18n";

export default function TermsPage() {
    const { t } = useTranslation();

    usePageMeta({
        title: t("terms.title", { defaultValue: "Termos de Uso — Bíblia Vive" }),
        description: t("terms.desc", { defaultValue: "Termos de uso do Bíblia Vive — plataforma de estudo bíblico digital" }),
        canonical: "/termos-de-uso",
    });

    return (
        <Layout>
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-serif text-app-text mb-6">📜 Termos de Uso — Bíblia Vive</h1>
                <p className="text-sm text-app-text-muted mb-8">
                    Última atualização: <span className="font-medium">[preencher data]</span>
                </p>
                
                <p className="text-app-text-muted mb-6">
                    Bem-vindo ao Bibliavive (https://bibliavive.com.br).
                    Ao acessar e utilizar este site, você concorda com os presentes Termos de Uso. Caso não concorde com qualquer parte destes termos, recomendamos que não utilize nossos serviços.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">1. 📌 Sobre o serviço</h2>
                <p className="text-app-text-muted mb-4">
                    O Bibliavive é uma plataforma digital que oferece acesso a conteúdos bíblicos, ferramentas de leitura, estudo e recursos interativos, incluindo:
                </p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>Leitura de textos bíblicos</li>
                    <li>Ferramentas de estudo e comentários</li>
                    <li>Funcionalidades personalizadas (ex: modo leitura, preferências)</li>
                    <li>Recursos interativos e conteúdos complementares</li>
                </ul>
                <p className="text-app-text-muted mb-4">
                    O serviço pode ser atualizado, modificado ou descontinuado a qualquer momento, sem aviso prévio.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">2. 👤 Uso da plataforma</h2>
                <p className="text-app-text-muted mb-4">
                    Ao utilizar o Bibliavive, você concorda em:
                </p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>Utilizar o site apenas para fins lícitos</li>
                    <li>Não violar leis locais, nacionais ou internacionais</li>
                    <li>Não tentar explorar vulnerabilidades ou comprometer a segurança da aplicação</li>
                    <li>Não realizar engenharia reversa, scraping abusivo ou automação não autorizada</li>
                </ul>
                <p className="text-app-text-muted font-medium mb-2">É proibido:</p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>Uso do site para fins ilegais ou maliciosos</li>
                    <li>Tentativas de acesso não autorizado a dados ou sistemas</li>
                    <li>Interferência no funcionamento da plataforma</li>
                </ul>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">3. 🔐 Conta e dados do usuário</h2>
                <p className="text-app-text-muted mb-4">
                    Caso o usuário utilize funcionalidades que envolvam dados pessoais ou autenticação:
                </p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>É responsável pela veracidade das informações fornecidas</li>
                    <li>Deve manter a confidencialidade de suas credenciais</li>
                    <li>É responsável por qualquer atividade realizada em sua conta</li>
                </ul>
                <p className="text-app-text-muted mb-4">
                    O Bibliavive não se responsabiliza por acessos indevidos decorrentes de negligência do usuário.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">4. 📖 Conteúdo e propriedade intelectual</h2>
                <p className="text-app-text-muted mb-4">
                    Todo o conteúdo disponível na plataforma, incluindo:
                </p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>Interface</li>
                    <li>Design</li>
                    <li>Código</li>
                    <li>Funcionalidades</li>
                </ul>
                <p className="text-app-text-muted mb-4">
                    é protegido por direitos autorais e propriedade intelectual.
                </p>
                <p className="text-app-text-muted mb-4">
                    O conteúdo bíblico pode ser proveniente de fontes públicas ou APIs externas e pode estar sujeito a licenças específicas.
                </p>
                <p className="text-app-text-muted font-medium mb-2">É proibido:</p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>Reproduzir, distribuir ou modificar o conteúdo sem autorização</li>
                    <li>Utilizar o conteúdo para fins comerciais sem consentimento</li>
                </ul>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">5. 🌐 Serviços de terceiros</h2>
                <p className="text-app-text-muted mb-4">
                    O Bibliavive pode integrar serviços de terceiros, como:
                </p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>APIs de conteúdo bíblico</li>
                    <li>Serviços de autenticação</li>
                    <li>Ferramentas de análise</li>
                </ul>
                <p className="text-app-text-muted mb-4">
                    Esses serviços possuem seus próprios termos e políticas, e o Bibliavive não se responsabiliza por seu funcionamento, disponibilidade ou conteúdo.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">6. ⚠️ Disponibilidade e limitações</h2>
                <p className="text-app-text-muted mb-4">
                    O serviço é fornecido “como está” e “conforme disponível”.
                </p>
                <p className="text-app-text-muted mb-4">
                    Não garantimos que:
                </p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>O site estará disponível de forma ininterrupta</li>
                    <li>Estará livre de erros ou falhas</li>
                    <li>Atenderá a todas as expectativas do usuário</li>
                </ul>
                <p className="text-app-text-muted mb-4">
                    Podemos realizar manutenções, atualizações ou interrupções sem aviso prévio.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">7. ⚖️ Limitação de responsabilidade</h2>
                <p className="text-app-text-muted mb-4">
                    Na máxima extensão permitida pela lei:
                </p>
                <ul className="list-disc list-inside text-app-text-muted mb-6 space-y-2">
                    <li>O Bibliavive não será responsável por danos diretos ou indiretos decorrentes do uso da plataforma</li>
                    <li>Não nos responsabilizamos por decisões tomadas com base no conteúdo disponibilizado</li>
                </ul>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">8. 🔒 Privacidade</h2>
                <p className="text-app-text-muted mb-4">
                    O uso da plataforma também está sujeito à nossa Política de Privacidade, que descreve como os dados dos usuários são coletados, utilizados e protegidos.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">9. 🔄 Alterações nos termos</h2>
                <p className="text-app-text-muted mb-4">
                    Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento.
                </p>
                <p className="text-app-text-muted mb-4">
                    Recomendamos que o usuário revise este documento periodicamente. O uso contínuo da plataforma após alterações constitui aceitação dos novos termos.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">10. 📍 Legislação aplicável</h2>
                <p className="text-app-text-muted mb-4">
                    Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
                </p>
                <p className="text-app-text-muted mb-4">
                    Quaisquer disputas serão resolvidas no foro da comarca do usuário, conforme legislação aplicável.
                </p>

                <hr className="my-8 border-border/50" />

                <h2 className="text-2xl font-serif text-app-text mb-4">11. 📬 Contato</h2>
                <p className="text-app-text-muted mb-4">
                    Em caso de dúvidas, sugestões ou solicitações relacionadas a estes Termos de Uso, entre em contato por meio dos canais disponíveis no site.
                </p>

                <hr className="my-8 border-border/50" />

                <p className="text-app-text-muted font-medium mb-4">✅ Declaração de aceite</p>
                <p className="text-app-text-muted mb-0">
                    Ao utilizar o Bibliavive, você declara que leu, compreendeu e concorda com estes Termos de Uso.
                </p>
            </div>
        </Layout>
    );
}