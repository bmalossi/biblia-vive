import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bell, X, Check, Loader2 } from "lucide-react";
import { getPushNotificationToken, isMessagingSupported } from "@/lib/firebase";

// Armazena em memória se o usuário dispensou a solicitação nesta sessão.
// Não utiliza localStorage conforme requisitos.
let sessionDismissed = false;

export function resetNotificationSoftAskSession() {
  sessionDismissed = false;
}

export default function NotificationSoftAsk() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Detecta se a viewport é mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDismiss = useCallback(() => {
    sessionDismissed = true;
    setIsVisible(false);
  }, []);

  // Handler para a tecla ESC
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleDismiss]);

  // Foco automático quando o card aparece (sem travar a navegação da página)
  useEffect(() => {
    if (isVisible && primaryBtnRef.current) {
      // Pequeno timeout para aguardar término da montagem/início da animação
      const timer = setTimeout(() => {
        primaryBtnRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Lógica de disparo (Timer ou Scroll)
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "default" ||
      sessionDismissed
    ) {
      return;
    }

    let disposed = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let handleScroll: (() => void) | undefined;

    const cleanup = () => {
      if (timerId) clearTimeout(timerId);
      if (handleScroll) window.removeEventListener("scroll", handleScroll);
    };

    isMessagingSupported().then((supported) => {
      if (!supported || disposed) return;

      const triggerShow = () => {
        if (sessionDismissed || Notification.permission !== "default") return;
        setIsVisible(true);
        cleanup();
      };

      timerId = setTimeout(triggerShow, 25000);

      handleScroll = () => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const threshold = document.documentElement.scrollHeight * 0.8;
        if (scrollPosition >= threshold) {
          triggerShow();
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Fluxo de ativação nativa + Firebase
  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        handleDismiss();
        return;
      }

      const token = await getPushNotificationToken();

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar inscrição");
      }

      setFeedbackSuccess(true);
      sessionDismissed = true;

      // Fecha o card após 2.5s exibindo o feedback positivo
      setTimeout(() => {
        setIsVisible(false);
      }, 2500);
    } catch {
      handleDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  const enterTransition = { duration: 0.4, ease: "easeOut" as const };
  const exitTransition = { duration: 0.35, ease: "easeOut" as const };

  const animationVariants = {
    hidden: prefersReducedMotion
      ? { opacity: 0 }
      : isMobile
        ? { opacity: 0, y: "100%" }
        : { opacity: 0, x: "100%" },
    visible: prefersReducedMotion
      ? { opacity: 1, transition: enterTransition }
      : isMobile
        ? { opacity: 1, y: 0, transition: enterTransition }
        : { opacity: 1, x: 0, transition: enterTransition },
    exit: prefersReducedMotion
      ? { opacity: 0, transition: exitTransition }
      : isMobile
        ? { opacity: 0, y: "100%", transition: exitTransition }
        : { opacity: 0, x: "100%", transition: exitTransition },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cardRef}
          role="dialog"
          aria-labelledby="softask-title"
          aria-describedby="softask-description"
          aria-label="Ativar notificações de novo conteúdo"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={animationVariants}
          className="fixed bottom-20 left-4 right-4 z-[60] sm:left-auto sm:right-6 md:bottom-6 md:w-[380px] p-5 rounded-2xl border border-border bg-app-surface text-app-text shadow-2xl backdrop-blur-md"
        >
          {/* Botão de Fechar X */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar"
            className="absolute top-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            <X className="h-4 w-4" />
          </button>

          {feedbackSuccess ? (
            /* Estado de confirmação pós-aceite */
            <div className="flex items-center gap-3 py-2 pr-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold border border-gold/30">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif font-semibold text-app-text text-sm">
                  Pronto! Você será avisado.
                </p>
                <p className="text-xs text-app-text-muted mt-0.5">
                  Acompanhe os novos capítulos e reflexões.
                </p>
              </div>
            </div>
          ) : (
            /* Estado normal do soft-ask card */
            <div className="pr-6">
              <div className="flex items-center gap-2 mb-1.5">
                <Bell className="h-4 w-4 text-gold shrink-0" />
                <h3
                  id="softask-title"
                  className="font-serif text-base font-semibold text-app-text tracking-tight"
                >
                  Para sua caminhada...
                </h3>
              </div>

              <p
                id="softask-description"
                className="text-xs sm:text-sm text-app-text-muted leading-relaxed mb-4"
              >
                Posso te lembrar quando um novo capítulo estiver esperando por você?
              </p>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2.5">
                <button
                  ref={primaryBtnRef}
                  type="button"
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sim, pode"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] min-w-[76px] items-center justify-center rounded-xl border border-border/80 bg-transparent px-4 py-2.5 text-xs font-medium text-app-text-muted hover:bg-app-raised hover:text-app-text transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50"
                >
                  Depois
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
