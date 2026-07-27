import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: ReturnType<typeof getMessaging> | null = null;

function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseMessaging() {
  if (!messaging) {
    const fbApp = getFirebaseApp();
    messaging = getMessaging(fbApp);
  }
  return messaging;
}

export async function isMessagingSupported(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  try {
    const supported = await isSupported();
    return supported;
  } catch {
    return false;
  }
}

const FCM_INDEXED_DB_NAMES = [
  "firebase-messaging-database",
  "firebase-installations-database",
];

export async function clearFirebaseMessagingIndexedDb(): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  await Promise.all(
    FCM_INDEXED_DB_NAMES.map(
      (name) =>
        new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
          request.onblocked = () => resolve();
        })
    )
  );
}

export async function getMessagingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await registration.update().catch(() => undefined);
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    try {
      return (await navigator.serviceWorker.getRegistration("/")) ?? null;
    } catch {
      return null;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export async function getPushNotificationToken(): Promise<string> {
  const messaging = getFirebaseMessaging();
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  const fetchToken = async () => {
    const registration = await getMessagingServiceWorkerRegistration();
    return withTimeout(
      getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration ?? undefined,
      }),
      15000,
      "Tempo esgotado ao registrar notificações"
    );
  };

  try {
    const token = await fetchToken();
    if (!token) throw new Error("Token FCM vazio");
    return token;
  } catch (firstError) {
    // Recuperação: IndexedDB corrompido/desatualizado após upgrade do SDK (v10 → v12 no SW).
    await clearFirebaseMessagingIndexedDb();
    const token = await fetchToken();
    if (!token) throw firstError;
    return token;
  }
}