import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
    isStandalone: boolean;
    isIos: boolean;
    hasPrompt: boolean;
    install: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    const isIos = typeof window !== "undefined" && /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    useEffect(() => {
        // Verifica se já está em modo standalone
        const checkStandalone = () => {
            return window.matchMedia("(display-mode: standalone)").matches ||
                (window.navigator as any).standalone === true;
        };

        setIsStandalone(checkStandalone());

        const onBeforeInstallPrompt = (e: Event) => {
            // Previne o Chrome 67 e anterior de mostrar o prompt automaticamente
            e.preventDefault();
            // Guarda o evento para acionarmos via botões depois
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        };
    }, []);

    const install = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
                setDeferredPrompt(null);
            }
        } else {
            // Fallback manual para quando o botão for exibido fixamente mas o Chrome bloqueou o evento programático
            alert("Para instalar, abra o menu de opções do seu navegador (três pontinhos no celular) e selecione 'Adicionar à Tela Inicial' ou 'Instalar Aplicativo'.");
        }
    };

    return (
        <PWAContext.Provider value={{ isStandalone, isIos, hasPrompt: !!deferredPrompt, install }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error("usePWA deve ser usado dentro de um PWAProvider");
    }
    return context;
}
