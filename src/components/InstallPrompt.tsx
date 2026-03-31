import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "bv_install_dismissed";
const IOS_HINT_KEY = "bv_ios_hint_shown";
const CHAPTER_CACHE_PREFIX = "bv-chapter-cache-v1";

const hasEngagement = () => {
  let chapterCount = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(CHAPTER_CACHE_PREFIX)) chapterCount += 1;
    if (chapterCount >= 2) return true;
  }
  return false;
};

export default function InstallPrompt() {
  const [ready, setReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isStandalone = useMemo(
    () => window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone,
    [],
  );
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    if (isStandalone) return;

    const timer = window.setTimeout(() => setReady(true), 90000);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, [isStandalone]);

  if (!ready || isStandalone || !hasEngagement()) return null;

  if (isIos && !deferredPrompt) {
    if (localStorage.getItem(IOS_HINT_KEY) === "true") return null;
    return (
      <div className="fixed inset-x-2 bottom-3 z-[115] rounded-xl border border-border bg-app-surface px-3 py-2 shadow-md animate-in slide-in-from-bottom-4">
        <p className="text-xs text-app-text">Para instalar: toque em compartilhar e depois “Adicionar à Tela de Início”.</p>
        <button
          className="mt-1 min-h-11 rounded-md px-2 text-xs text-app-text-muted hover:bg-app-raised"
          onClick={() => localStorage.setItem(IOS_HINT_KEY, "true")}
          type="button"
        >
          Entendi
        </button>
      </div>
    );
  }

  if (!deferredPrompt || localStorage.getItem(DISMISS_KEY) === "true") return null;

  return (
    <div className="fixed inset-x-2 bottom-3 z-[115] rounded-xl border border-border bg-app-surface px-3 py-2 shadow-md animate-in slide-in-from-bottom-4 sm:inset-x-auto sm:left-1/2 sm:w-[min(720px,95vw)] sm:-translate-x-1/2">
      <div className="flex min-h-11 items-center gap-3">
        <div aria-hidden className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-gold">✦</div>
        <p className="flex-1 text-sm text-app-text">Instale o Bíblia Vive no seu celular — leia offline, grátis.</p>
        <button
          className="min-h-11 rounded-full bg-primary px-3 text-sm text-primary-foreground"
          onClick={async () => {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome !== "accepted") localStorage.setItem(DISMISS_KEY, "true");
            setDeferredPrompt(null);
          }}
          type="button"
        >
          Instalar
        </button>
        <button
          aria-label="Dispensar instalação"
          className="min-h-11 rounded-md px-2 text-app-text-muted hover:bg-app-raised"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "true");
            setDeferredPrompt(null);
          }}
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
