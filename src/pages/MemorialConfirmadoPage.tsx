// ─────────────────────────────────────────────────────────────────────────────
// MemorialConfirmadoPage.tsx — Bíblia Vive & Memorial
//
// Página de confirmação de cadastro do Memorial.
// Segue rigorosamente o padrão editorial nobre e contemplativo do Memorial:
// Dual-tone sóbrio, tipografia solene, zero AI-slop e integração com deep link móvel.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function MemorialConfirmadoPage() {
    usePageMeta({
        title: "Cadastro Confirmado — Memorial",
        description: "Seu acesso unificado ao Memorial e Bíblia Vive foi confirmado com sucesso.",
        robots: "noindex, nofollow",
    });

    const [isMobile, setIsMobile] = useState(false);
    const [redirectAttempted, setRedirectAttempted] = useState(false);

    // Constrói o link profundo preservando os parâmetros de token ou hash para o app mobile
    const getDeepLinkUrl = (scheme: string) => {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const payload = hash || search || '';
        return `${scheme}://auth/callback${payload}`;
    };

    useEffect(() => {
        const mobileCheck = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);

        // Se estiver em smartphone, realiza o disparo suave para abrir o app Memorial instalado
        if (mobileCheck) {
            const timer = setTimeout(() => {
                setRedirectAttempted(true);
                window.location.href = getDeepLinkUrl('memorial');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleOpenMobileApp = () => {
        setRedirectAttempted(true);
        // Tenta esquema canônico memorial:// com fallback para exp+memorial-app://
        window.location.href = getDeepLinkUrl('memorial');
        setTimeout(() => {
            window.location.href = getDeepLinkUrl('exp+memorial-app');
        }, 900);
    };

    return (
        <Layout hideHeader hideMobileNav hideFooter className="bg-[#0E0D11]">
            <main
                id="main-content"
                className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 selection:bg-[#E7B075]/20 selection:text-[#F7F5F0]"
            >
                {/* Iluminação ambiente dourada muito difusa e contemplativa */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E7B075]/[0.035] blur-[100px]" />
                </div>

                {/* Card de Confirmação Editorial (Padrão Memorial) */}
                <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#2B2836] bg-[#18171D] p-8 text-center shadow-2xl md:p-10">
                    
                    {/* Círculo do Logotipo do Memorial */}
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#E7B075]/20 bg-[#211F28] shadow-inner">
                        <img
                            src="/images/memorial-logo.png"
                            alt="Logotipo Memorial"
                            className="h-8 w-8 object-contain"
                            onError={(e) => {
                                // Fallback elegante em caso de ausência do arquivo local
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
                        Conta confirmada
                    </h1>

                    {/* Divisor minimalista */}
                    <div className="mx-auto my-4 h-px w-10 bg-[#E7B075]/20" />

                    {/* Mensagem Solene */}
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#A6A19A]">
                        Seu acesso unificado foi validado. Você já pode retornar ao aplicativo para registrar e guardar suas memórias, orações e reflexões espirituais.
                    </p>

                    {/* Ações */}
                    <div className="mt-8 flex flex-col gap-3">
                        {/* Botão Primário: Retornar / Abrir App */}
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

                    {/* Se o redirecionamento automático falhar ou estiver em desktop */}
                    {isMobile && redirectAttempted && (
                        <p className="mt-4 text-[11.5px] leading-relaxed text-[#7A756E]">
                            Se o aplicativo não abrir automaticamente, toque no botão acima ou abra o app diretamente no seu telefone.
                        </p>
                    )}

                    {/* Citação Escritural de Fechamento */}
                    <div className="mt-8 border-t border-[#2B2836]/70 pt-6">
                        <blockquote className="font-serif text-xs italic tracking-wide text-[#7A756E]">
                            “Tudo o que Deus tem feito, permanece.”
                            <span className="block not-italic text-[10.5px] text-[#635E57] mt-1 font-sans">
                                Eclesiastes 3:14
                            </span>
                        </blockquote>
                    </div>
                </div>

                {/* Link Discreto de Retorno ao Bíblia Vive */}
                <div className="relative z-10 mt-6 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs text-[#635E57] transition-colors hover:text-[#A6A19A]"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Voltar para a página inicial do Bíblia Vive</span>
                    </Link>
                </div>
            </main>
        </Layout>
    );
}
