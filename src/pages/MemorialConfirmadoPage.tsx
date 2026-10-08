// ─────────────────────────────────────────────────────────────────────────────
// MemorialConfirmadoPage.tsx — Bíblia Vive & Memorial
//
// Tela apropriada do Memorial exibida ao clicar no link de confirmação
// de e-mail enviado pelo Supabase. Permite abrir o app Memorial no celular
// ou continuar para a versão web do Memorial.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Smartphone, Globe, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function MemorialConfirmadoPage() {
    usePageMeta({
        title: "E-mail Confirmado — Memorial",
        description: "Confirmação de e-mail realizada com sucesso no Memorial e Bíblia Vive.",
        robots: "noindex, nofollow",
    });

    const [isMobile, setIsMobile] = useState(false);
    const [openedApp, setOpenedApp] = useState(false);

    useEffect(() => {
        const mobileCheck = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);

        // Se estiver em dispositivo móvel, tenta acionar a abertura suave do aplicativo Memorial
        if (mobileCheck) {
            const timer = setTimeout(() => {
                window.location.href = 'memorial://auth/callback';
            }, 600);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleOpenApp = () => {
        setOpenedApp(true);
        // Tenta esquema customizado memorial:// e fallback exp+memorial-app://
        window.location.href = 'memorial://auth/callback';
        setTimeout(() => {
            window.location.href = 'exp+memorial-app://auth/callback';
        }, 800);
    };

    return (
        <Layout>
            <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
                <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface p-8 text-center shadow-xl">
                    {/* Selo / Header Solene */}
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500">
                        <span>Memorial</span>
                        <span className="text-app-text-muted">·</span>
                        <span>Bíblia Vive</span>
                    </div>

                    {/* Ícone de Sucesso */}
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>

                    {/* Títulos */}
                    <h1 className="mb-2 font-serif text-2xl font-bold tracking-tight text-app-text">
                        E-mail Confirmado com Sucesso!
                    </h1>
                    <p className="mb-8 text-sm leading-relaxed text-app-text-secondary">
                        Sua conta unificada está ativa. Agora você pode registrar suas orações, reflexões e testemunhos com total privacidade e cobertura pastoral.
                    </p>

                    {/* Ações */}
                    <div className="flex flex-col gap-3">
                        {/* Botão de Abrir App */}
                        <button
                            onClick={handleOpenApp}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3.5 text-sm font-semibold text-stone-950 shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
                        >
                            <Smartphone className="h-4 w-4" />
                            <span>Abrir no Aplicativo Memorial</span>
                        </button>

                        {/* Botão de Continuar na Web */}
                        <Link
                            to="/memorial"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-app-border bg-app-raised px-5 py-3 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                        >
                            <Globe className="h-4 w-4 text-app-text-muted" />
                            <span>Acessar Memorial na Web</span>
                        </Link>
                    </div>

                    {/* Link para Bíblia Vive */}
                    <div className="mt-8 border-t border-app-border/60 pt-6">
                        <Link
                            to="/planos"
                            className="inline-flex items-center gap-1.5 text-xs text-app-text-muted transition-colors hover:text-amber-500"
                        >
                            <span>Ir para Planos de Leitura no Bíblia Vive</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
