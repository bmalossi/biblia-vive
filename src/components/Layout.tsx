import Header from "@/components/Header";
import { getVersion } from "@/lib/themes";
import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideMobileNav?: boolean;
}

const mobileNav = [
  { icon: "🏠", label: "Início", to: "/" },
  { icon: "📖", label: "Ler", to: (version: string) => `/${version}/gn` },
  { icon: "🔍", label: "Buscar", to: "/busca" },
  { icon: "📚", label: "Planos", to: "/planos" },
  { icon: "🖼️", label: "Compartilhar", to: "/compartilhar" },
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
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-app-surface transition-opacity duration-200 md:hidden ${hideMobileNav ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
      >
        <ul className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const target = typeof item.to === "function" ? item.to(version) : item.to;
            const isActive = target === "/" ? location.pathname === "/" : location.pathname.startsWith(target);
            return (
              <li key={item.label}>
                <Link
                  className={`flex h-14 flex-col items-center justify-center gap-1 text-[0.65rem] ${isActive ? "text-gold" : "text-app-text-muted"
                    }`}
                  to={target}
                >
                  <span className="text-base" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="font-sans uppercase tracking-[0.06em]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}