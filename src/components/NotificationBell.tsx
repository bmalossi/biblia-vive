import { useState, useEffect, useCallback } from "react";
import { getToken } from "firebase/messaging";
import { Bell, Loader2, AlertCircle } from "lucide-react";
import { getFirebaseMessaging, isMessagingSupported } from "@/lib/firebase";

type Status = "idle" | "activating" | "activated" | "denied" | "unsupported";

export default function NotificationBell() {
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    checkInitialState();
  }, []);

  async function getExistingRegistration(): Promise<ServiceWorkerRegistration | null> {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      if (registration) return registration;
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }

  async function checkInitialState() {
    const supported = await isMessagingSupported();
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission === "granted") {
      try {
        const registration = await getExistingRegistration();
        const messaging = getFirebaseMessaging();
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration || undefined,
        });
        if (currentToken) {
          setStatus("activated");
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("idle");
      }
    }
  }

  const handleToggle = useCallback(async () => {
    if (status === "activated") {
      await deactivate();
      return;
    }
    await activate();
  }, [status]);

  async function activate() {
    setFeedback(null);
    setStatus("activating");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setFeedback(
          "Permissão negada. Você pode ativar as notificações nas configurações do seu navegador."
        );
        return;
      }

      const registration = await getExistingRegistration();
      const messaging = getFirebaseMessaging();
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration || undefined,
      });

      if (!token) {
        setStatus("idle");
        setFeedback(
          "Não foi possível registrar as notificações. Verifique se o site não está bloqueado nas configurações."
        );
        return;
      }

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar preferência");
      }

      setStatus("activated");
      setFeedback("Notificações ativadas! Você receberá alertas de novos artigos.");
    } catch (err: any) {
      setStatus("idle");
      setFeedback(
        err.message === "Failed to execute 'subscribe' on 'PushManager'"
          ? "Erro ao registrar notificações. Verifique sua conexão."
          : err.message || "Erro ao ativar notificações."
      );
    }
  }

  async function deactivate() {
    try {
      const registration = await getExistingRegistration();
      const messaging = getFirebaseMessaging();
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration || undefined,
      });
      if (currentToken) {
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
        });
      }
    } catch {
      // token removal is best-effort
    } finally {
      setStatus("idle");
      setFeedback("Notificações desativadas.");
    }
  }

  if (status === "unsupported") return null;

  return (
    <div className="relative">
      <button
        aria-label={
          status === "activated"
            ? "Notificações ativadas - clique para desativar"
            : "Ativar notificações de novos artigos"
        }
        onClick={handleToggle}
        disabled={status === "activating" || status === "denied"}
        className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-all flex-shrink-0 ${
          status === "activated"
            ? "border-gold/30 bg-gold/10 text-gold hover:bg-gold/20"
            : "border-border bg-transparent text-app-text-muted hover:bg-app-raised hover:text-app-text"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          status === "activated"
            ? "Notificações ativadas"
            : "Ativar notificações"
        }
      >
        {status === "activating" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === "activated" ? (
          <Bell className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Bell className="h-3.5 w-3.5" />
        )}
      </button>

      {feedback && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-border bg-app-surface p-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            {status === "activated" ? (
              <Bell className="h-4 w-4 text-gold mt-0.5 shrink-0" />
            ) : status === "denied" ? (
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-app-text-muted mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-xs text-app-text leading-relaxed">{feedback}</p>
              <button
                onClick={() => setFeedback(null)}
                className="mt-2 text-xs text-gold hover:underline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}