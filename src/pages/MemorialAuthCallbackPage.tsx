// ─────────────────────────────────────────────────────────────────────────────
// MemorialAuthCallbackPage.tsx — Bíblia Vive & Memorial
//
// Ponte OAuth e Deep Linking para o aplicativo móvel Memorial.
// Recebe o redirecionamento do Google/OAuth e transfere a sessão diretamente
// para o aplicativo Memorial instalado no dispositivo (esquema memorial://).
// Design solene, sóbrio, editorial e livre de qualquer padrão genérico.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function MemorialAuthCallbackPage() {
    usePageMeta({
        title: "Autenticação — Memorial",
        description: "Retornando ao aplicativo Memorial com sua conta unificada.",
        robots: "noindex, nofollow",
    });

    const [isMobile, setIsMobile] = useState(false);
    const [redirectAttempted, setRedirectAttempted] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Extrai o payload completo de autenticação (hash fragment ou query params)
    const getPayload = () => {
        if (typeof window === 'undefined') return '';
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        return hash || search || '';
    };

    // Constrói o deep link preservando os parâmetros para o app mobile
    const getDeepLinkUrl = (scheme: string) => {
        const payload = getPayload();
        return `${scheme}://auth/callback${payload}`;
    };

    useEffect(() => {
        const mobileCheck = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);

        // Verifica se houve erro ou cancelamento retornado pelo OAuth
        if (typeof window !== 'undefined') {
            const fullParams = window.location.search + '&' + window.location.hash.replace('#', '');
            const params = new URLSearchParams(fullParams);
            const err = params.get('error') || params.get('error_description');
            if (err) {
                setIsError(true);
                if (err.includes('access_denied')) {
                    setErrorMessage('O login com o Google foi cancelado. Você pode retornar ao aplicativo e tentar novamente.');
                } else {
                    setErrorMessage('Não foi possível concluir o login com o Google no momento.');
                }
                return;
            }
        }

        // Se for smartphone, dispara imediatamente a transição para o app Memorial
        if (mobileCheck) {
            const timer = setTimeout(() => {
                setRedirectAttempted(true);
                window.location.href = getDeepLinkUrl('memorial');
            }, 350);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleOpenMobileApp = () => {
        setRedirectAttempted(true);
        window.location.href = getDeepLinkUrl('memorial');
        setTimeout(() => {
            window.location.href = getDeepLinkUrl('exp+memorial-app');
        }, 850);
    };

    return (
        <Layout hideHeader hideMobileNav hideFooter className="bg-[#0E0D11]">
            <main
                id="main-content"
                className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 selection:bg-[#E7B075]/20 selection:text-[#F7F5F0]"
            >
                {/* Iluminação ambiente dourada difusa e contemplativa */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E7B075]/[0.035] blur-[110px]" />
                </div>

                {/* Card Editorial do Memorial */}
                <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#2B2836] bg-[#18171D] p-8 text-center shadow-2xl md:p-10">
                    
                    {/* Logotipo do Memorial */}
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#E7B075]/20 bg-[#211F28] shadow-inner">
                        <img
                            src="/images/memorial-logo.png"
                            alt="Logotipo Memorial"
                            className="h-8 w-8 object-contain"
                            onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                        />
                    </div>

                    {/* Kicker Editorial */}
                    <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.28em] text-[#E7B075]">
                        MEMORIAL · BÍBLIA VIVE
                    </p>

                    {/* Título Serif */}
                    <h1 className="mt-2 font-serif text-2xl font-normal tracking-tight text-[#F7F5F0] sm:text-3xl">
                        {isError ? 'Autenticação não concluída' : 'Autenticação concluída'}
                    </h1>

                    {/* Divisor minimalista */}
                    <div className="mx-auto my-4 h-px w-10 bg-[#E7B075]/20" />

                    {/* Mensagem Editorial */}
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#A6A19A]">
                        {isError
                            ? errorMessage
                            : 'Sua conta foi autenticada com sucesso. Retornando ao aplicativo Memorial para acessar seus marcos e registros espirituais.'}
                    </p>

                    {/* Ações */}
                    <div className="mt-8 flex flex-col gap-3">
                        {/* Botão Primário: Abrir no Memorial */}
                        <button
                            type="button"
                            onClick={handleOpenMobileApp}
                            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#B87E28] px-5 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#C98B32] active:scale-[0.99]"
                        >
                            <span>Abrir no Aplicativo Memorial</span>
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </button>

                        {/* Botão Secundário: Continuar no Memorial Web */}
                        <Link
                            to="/memorial"
                            className="inline-flex w-full items-center justify-center rounded-xl border border-[#2B2836] bg-[#211F28] px-5 py-3 text-xs font-medium text-[#CBC7BD] transition-colors hover:bg-[#2A2733] hover:text-[#F7F5F0]"
                        >
                            <span>Continuar no navegador web</span>
                        </Link>
                    </div>

                    {/* Orientação suave para celular */}
                    {isMobile && redirectAttempted && !isError && (
                        <p className="mt-4 text-[11.5px] leading-relaxed text-[#7A756E]">
                            Se o aplicativo não abrir automaticamente, toque no botão acima ou abra o Memorial no seu aparelho.
                        </p>
                    )}

                    {/* Citação Bíblica Contemplativa */}
                    <div className="mt-8 border-t border-[#2B2836]/70 pt-6">
                        <blockquote className="font-serif text-xs italic tracking-wide text-[#7A756E]">
                            “Tudo o que Deus tem feito, permanece.”
                            <span className="block not-italic text-[10.5px] text-[#635E57] mt-1 font-sans">
                                Eclesiastes 3:14
                            </span>
                        </blockquote>
                    </div>
                </div>

                {/* Retorno discreto ao Bíblia Vive */}
                <div className="relative z-10 mt-6 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs text-[#635E57] transition-colors hover:text-[#A6A19A]"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Ir para a página inicial do Bíblia Vive</span>
                    </Link>
                </div>
            </main>
        </Layout>
    );
}
