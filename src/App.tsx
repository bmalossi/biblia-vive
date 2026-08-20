import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastViewport } from "@/components/Toast";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAProvider } from "@/contexts/PWAContext";
import { SpeedInsights } from '@vercel/speed-insights/react';
import ScrollToTop from "@/components/ScrollToTop";
import { NotebookProvider } from "@/contexts/NotebookContext";
import { HarpaPlayerProvider } from "@/contexts/HarpaPlayerContext";
import GlobalNotebookContainer from "@/components/GlobalNotebookContainer";


const HomePage = lazy(() => import('./pages/HomePage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const BookPage = lazy(() => import("./pages/BookPage"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const MemorialPage = lazy(() => import("./pages/MemorialPage"));
const MemorialEntryPage = lazy(() => import("./pages/MemorialEntryPage"));
const MyNotesPage = lazy(() => import("./pages/MyNotesPage"));
const ReadingPlansPage = lazy(() => import("./pages/ReadingPlansPage"));
const SharePage = lazy(() => import("./pages/SharePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminArtigosPage = lazy(() => import("./pages/AdminArtigosPage"));
const AdminComentariosPage = lazy(() => import("./pages/AdminComentariosPage"));
const AdminUsuariosPage = lazy(() => import("./pages/AdminUsuariosPage"));
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
const HowToPage = lazy(() => import("./pages/HowToPage"));
const HarpaPage = lazy(() => import("./pages/HarpaPage"));
const HarpaReadingPage = lazy(() => import("./pages/HarpaReadingPage"));
const AdminAutoresPage = lazy(() => import('./pages/AdminAutoresPage'));
const AdminCapitulosPage = lazy(() => import('./pages/AdminCapitulosPage'));
const JornadasPage = lazy(() => import('./pages/JornadasPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min
    },
  },
});

const PageFallback = () => (
  <div aria-busy="true" aria-label="Carregando..." className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-gold" />
    <span className="font-sans text-sm tracking-wide text-app-text-muted">Carregando Bíblia Vive...</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/*
      BrowserRouter deve ser o provider mais externo (logo após QueryClientProvider)
      para garantir que AuthProvider, PWAProvider e TooltipProvider possam usar
      hooks do React Router sem gerar TypeError por contexto ausente.
      Causa do bug: mountLazyComponent tentava resolver useNavigate antes do
      contexto do Router estar disponível quando o Router era um provider interno.
    */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PWAProvider>
        <AuthProvider>
          <TooltipProvider>
            <NotebookProvider>
              <HarpaPlayerProvider>
                <ScrollToTop />
                <ToastViewport />
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/busca" element={<SearchPage />} />
                  <Route path="/harpa" element={<HarpaPage />} />
                  <Route path="/harpa/:hymnNumber" element={<HarpaReadingPage />} />
                  <Route path="/:version/:book" element={<BookPage />} />
                  <Route path="/:version/:book/:chapter" element={<ReadingPage />} />
                  <Route path="/memorial" element={<MemorialPage />} />
                  <Route path="/memorial/:id" element={<MemorialEntryPage />} />
                  <Route path="/minhas-notas" element={<Navigate to="/memorial" replace />} />
                  <Route path="/planos" element={<ReadingPlansPage />} />
                  <Route path="/jornadas" element={<JornadasPage />} />
                  <Route path="/compartilhar" element={<SharePage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/capitulos" element={<AdminCapitulosPage />} />
                  <Route path="/admin/artigos" element={<AdminArtigosPage />} />
                  <Route path="/admin/autores" element={<AdminAutoresPage />} />
                  <Route path="/admin/comentarios" element={<AdminComentariosPage />} />
                  <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
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
                  <Route path="/autor/:slug" element={<AuthorPage />} />
                  <Route path="/meu-estudo" element={<MyStudyPage />} />
                  <Route path="/como-usar" element={<HowToPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
                <GlobalNotebookContainer />
              </HarpaPlayerProvider>
            </NotebookProvider>
          </TooltipProvider>
        </AuthProvider>
      </PWAProvider>
      <SpeedInsights />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
