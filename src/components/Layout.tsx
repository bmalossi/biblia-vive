import Header from "@/components/Header";
import NotificationSoftAsk from "@/components/NotificationSoftAsk";
import { getVersion } from "@/lib/themes";
import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { Home, Search, Bookmark } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideMobileNav?: boolean;
}

const mobileNav = [
  { icon: Home, label: "Início", to: "/" },
  { icon: Search, label: "Buscar", to: "/busca" },
  { icon: Bookmark, label: "Memorial", to: "/memorial" },
];

export default function Layout({ children, hideHeader = false, hideMobileNav = false }: LayoutProps) {
  const location = useLocation();
  const version = getVersion();

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <div className={`transition-opacity duration-200 ${hideHeader ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <Header />
      </div>
      <main className={`mx-auto w-full max-w-6xl px-4 md:px-6 md:pb-10 flex-grow ${hideHeader ? "pb-12 pt-3" : "pb-24 pt-[68px]"}`} id="main-content">
        {children}
      </main>

      {!hideHeader && !hideMobileNav && (
        <footer className="mt-auto border-t border-border bg-app-surface py-12 pb-28 md:pb-12 text-center md:text-left">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6 grid gap-8 md:grid-cols-3">
            <div>
              <img
                src="/logo_icon.png"
                alt="Logo Bíblia Vive"
                className="h-10 sm:h-12 w-auto object-contain mb-2 mx-auto md:mx-0"
              />
              <h3 className="text-gold font-serif text-xl mb-3">Bíblia Vive</h3>
              <p className="text-app-text-muted text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                Cultivando a permanência diária nas Escrituras por meio de uma experiência de leitura, estudo e reflexão centrada na Palavra.
              </p>
            </div>
            <div>
              <h4 className="text-app-text font-medium mb-4 uppercase tracking-wider text-xs">Acesso</h4>
              <ul className="space-y-3">
                <li><Link to="/artigos" className="text-sm text-app-text-muted hover:text-gold transition-colors">Artigos</Link></li>
                <li><Link to="/sobre" className="text-sm text-app-text-muted hover:text-gold transition-colors">Sobre Nós & Missão</Link></li>
                <li><Link to="/apoiar" className="text-sm text-app-text-muted hover:text-gold transition-colors">Apoiar o Projeto 💙</Link></li>
                <li><Link to="/pro" className="text-sm text-app-text-muted hover:text-gold transition-colors">Assinatura PRO</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-app-text font-medium mb-4 uppercase tracking-wider text-xs">Páginas Legais</h4>
              <ul className="space-y-3">
                <li><Link to="/sobre" className="text-sm text-app-text-muted hover:text-gold transition-colors">Licenças de Tradução</Link></li>
                <li><Link to="/termos-de-uso" className="text-sm text-app-text-muted hover:text-gold transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>
          </div>
          <div className="w-full max-w-6xl mx-auto px-4 md:px-6 mt-10 pt-4 border-t border-border/50 text-center">
            <span className="text-xs text-app-text-muted uppercase tracking-widest font-mono">Bíblia Vive © 2026</span>
          </div>
        </footer>
      )}

      <nav
        aria-label="Navegação móvel"
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-app-surface transition-opacity duration-200 md:hidden pt-2 pb-[env(safe-area-inset-bottom,0.5rem)] ${hideMobileNav ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
      >
        <ul className="grid grid-cols-3 gap-1">
          {mobileNav.map((item) => {
            const target = typeof item.to === "function" ? item.to(version) : item.to;
            const isActive = target === "/" ? location.pathname === "/" : location.pathname.startsWith(target);
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  className={`flex flex-col items-center justify-center gap-1.5 transition-colors ${isActive ? "text-gold" : "text-app-text-muted"
                    }`}
                  to={target}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                  <span className="text-[0.62rem] font-sans font-medium uppercase tracking-[0.05em]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <NotificationSoftAsk />
    </div>
  );
}