import Header from "@/components/Header";
import { getVersion } from "@/lib/themes";
import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { Home, BookOpen, Search, Library, Share2 } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideMobileNav?: boolean;
}

const mobileNav = [
  { icon: Home, label: "Início", to: "/" },
  { icon: BookOpen, label: "Ler", to: (version: string) => `/${version}/gn` },
  { icon: Search, label: "Buscar", to: "/busca" },
  { icon: Library, label: "Planos", to: "/planos" },
  { icon: Share2, label: "Compartilhar", to: "/compartilhar" },
];

export default function Layout({ children, hideHeader = false, hideMobileNav = false }: LayoutProps) {
  const location = useLocation();
  const version = getVersion();

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <div className={`transition-opacity duration-200 ${hideHeader ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <Header />
      </div>
      <main className={`mx-auto w-full max-w-6xl px-4 md:px-6 md:pb-10 ${hideHeader ? "pb-12 pt-3" : "pb-24 pt-[68px]"}`} id="main-content">
        {children}
      </main>

      <nav
        aria-label="Navegação móvel"
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-app-surface transition-opacity duration-200 md:hidden pt-2 pb-[env(safe-area-inset-bottom,0.5rem)] ${hideMobileNav ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
      >
        <ul className="grid grid-cols-5 gap-1">
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
    </div>
  );
}