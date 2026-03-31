import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import InstallPrompt from "@/components/InstallPrompt";
import { ToastViewport } from "@/components/Toast";
import { Loader2 } from "lucide-react";
import HomePage from "./pages/HomePage";

const BookPage = lazy(() => import("./pages/BookPage"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const MyNotesPage = lazy(() => import("./pages/MyNotesPage"));
const ReadingPlansPage = lazy(() => import("./pages/ReadingPlansPage"));
const SharePage = lazy(() => import("./pages/SharePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const WidgetDailyVerse = lazy(() => import("./pages/WidgetDailyVerse"));
const PricingPage = lazy(() => import("./pages/PricingPage"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div aria-busy="true" aria-label="Carregando..." className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-gold" />
    <span className="font-sans text-sm tracking-wide text-app-text-muted">Carregando Bíblia Viva...</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastViewport />
      <InstallPrompt />
      <BrowserRouter>
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
            <Route path="/pro" element={<PricingPage />} />
            <Route path="/widget/daily" element={<WidgetDailyVerse />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
