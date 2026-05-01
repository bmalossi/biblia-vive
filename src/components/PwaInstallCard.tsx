import { usePWA } from "@/contexts/PWAContext";
import { Download, Share } from "lucide-react";

interface Props {
    variant?: "home" | "drawer";
}

export default function PwaInstallCard({ variant = "home" }: Props) {
    const { isStandalone, isIos, install } = usePWA();

    // Se já for PWA standalone instalado, escondemos o card para sempre
    if (isStandalone) return null;

    if (variant === "drawer") {
        return (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 mx-4 my-2 mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-gold" />
                    <p className="font-semibold text-sm text-gold">Instale o App Completo</p>
                </div>
                {isIos ? (
                    <p className="text-xs text-app-text-muted leading-relaxed">
                        Para instalar no seu iPhone, toque no botão de <Share className="inline-block h-3.5 w-3.5 mb-0.5" /> <strong>Compartilhar</strong> do Safári e depois em <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                ) : (
                    <>
                        <p className="text-xs text-app-text-muted leading-tight mb-3">
                            Tenha a Bíblia Vive nativamente no seu celular. Leia offline, grátis e super rápido.
                        </p>
                        <button
                            onClick={install}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2 text-xs font-medium text-app-bg transition-colors hover:bg-gold-hover"
                        >
                            Instalar Aplicativo
                        </button>
                    </>
                )}
            </div>
        );
    }

    // variant === "home"
    return (
        <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/10 to-transparent p-5 my-6 animate-in fade-in zoom-in duration-500 md:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-serif text-lg text-gold flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Instale o Aplicativo
                    </h3>
                    <p className="mt-1 text-sm text-app-text-muted max-w-sm leading-relaxed">
                        {isIos ? (
                            <>Para instalar o Bíblia Vive gratuitamente no iPhone, toque no botão de <strong>Compartilhar</strong> <Share className="inline-block h-3.5 w-3.5 mx-0.5" /> e depois em <strong>"Adicionar à Tela de Início"</strong>.</>
                        ) : (
                            "Tenha a Bíblia Vive nativamente no seu dispositivo. Leia offline, receba atualizações e aproveite 100% grátis sem anúncios."
                        )}
                    </p>
                </div>
                {!isIos && (
                    <button
                        onClick={install}
                        className="whitespace-nowrap rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-app-bg transition-colors hover:bg-gold-hover shadow-sm"
                    >
                        Instalar Agora
                    </button>
                )}
            </div>
        </div>
    );
}
