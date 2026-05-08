import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastViewport } from "@/components/Toast";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAProvider } from "@/contexts/PWAContext";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';


const HomePage = lazy(() => import('./pages/HomePage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const BookPage = lazy(() => import("./pages/BookPage"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const MyNotesPage = lazy(() => import("./pages/MyNotesPage"));
const ReadingPlansPage = lazy(() => import("./pages/ReadingPlansPage"));
const SharePage = lazy(() => import("./pages/SharePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminArtigosPage = lazy(() => import("./pages/AdminArtigosPage"));
const WidgetDailyVerse = lazy(() => import("./pages/WidgetDailyVerse"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ProSuccessPage = lazy(() => import("./pages/ProSuccessPage"));
const ChurchDisplayPage = lazy(() => import("./pages/ChurchDisplayPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const MyStudyPage = lazy(() => import("./pages/MyStudyPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const ArtigoPage = lazy(() => import("./pages/ArtigoPage"));
const ArtigosIndexPage = lazy(() => import("./pages/ArtigosIndexPage"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div aria-busy="true" aria-label="Carregando..." className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-gold" />
    <span className="font-sans text-sm tracking-wide text-app-text-muted">Carregando Bíblia Vive...</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PWAProvider>
      <AuthProvider>
        <TooltipProvider>
          <ToastViewport />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/busca" element={<SearchPage />} />
                <Route path="/:version/:book" element={<BookPage />} />
                <Route path="/:version/:book/:chapter" element={<ReadingPage />} />
                <Route path="/minhas-notas" element={<MyNotesPage />} />
                <Route path="/planos" element={<ReadingPlansPage />} />
                <Route path="/compartilhar" element={<SharePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/artigos" element={<AdminArtigosPage />} />
                <Route path="/pro" element={<PricingPage />} />
                <Route path="/pro/success" element={<ProSuccessPage />} />
                <Route path="/widget/daily" element={<WidgetDailyVerse />} />
                <Route path="/church-display" element={<ChurchDisplayPage />} />
                <Route path="/conta" element={<AccountPage />} />
                <Route path="/sobre" element={<AboutPage />} />
                <Route path="/termos-de-uso" element={<TermsPage />} />
                <Route path="/apoiar" element={<SupportPage />} />
                <Route path="/artigos" element={<ArtigosIndexPage />} />
                <Route path="/artigos/:slug" element={<ArtigoPage />} />
                <Route path="/meu-estudo" element={<MyStudyPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </PWAProvider>
    <Analytics />
    <SpeedInsights />
  </QueryClientProvider>
);

export default App;
