import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import VersionSelector from "@/components/VersionSelector";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { formatParsedReferenceLabel, parseReference } from "@/lib/referenceParser";
import { getVersion } from "@/lib/themes";
import { Clock3, LogIn, LogOut, Menu, Search, SearchX, User, X } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Link, NavLink } from "react-router-dom";
import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Início", href: "/" },
  { label: "Planos", href: "/planos" },
];

const HISTORY_KEY = "bv_search_history";

const readHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [] as string[];
  }
};

const saveHistoryItem = (term: string) => {
  if (!term.trim()) return;
  const unique = [term.trim(), ...readHistory().filter((item) => item.toLowerCase() !== term.trim().toLowerCase())].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(unique));
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isPro, loading: proLoading } = useSubscription();
  const userRole = (user?.app_metadata as any)?.role;
  const [isScrolled, setIsScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const parsedReference = useMemo(() => parseReference(query), [query]);
  const parsedReferenceLabel = useMemo(
    () => (parsedReference ? formatParsedReferenceLabel(parsedReference) : ""),
    [parsedReference],
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === "/busca") {
      setQuery(params.get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current?.contains(event.target as Node)) return;
      setIsDropdownOpen(false);
      setIsMobileSearchOpen(false);
    };

    const onGlobalKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typingInField = target && ["INPUT", "TEXTAREA"].includes(target.tagName);

      if (event.key === "/" && !typingInField) {
        event.preventDefault();
        setIsDropdownOpen(true);
        setIsMobileSearchOpen(true);
        inputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onGlobalKey);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onGlobalKey);
    };
  }, []);

  const runSearch = (value: string) => {
    const term = value.trim();
    if (!term) return;
    saveHistoryItem(term);
    setHistory(readHistory());
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
    navigate(`/busca?q=${encodeURIComponent(term)}&v=${getVersion()}&mode=text`);
  };

  const goToReference = () => {
    if (!parsedReference) return;
    const hash = parsedReference.verse ? `#v${parsedReference.verse}` : "";
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
    navigate(`/${getVersion()}/${parsedReference.slug}/${parsedReference.chapter}${hash}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(query);
  };

  const openSearch = () => {
    setIsDropdownOpen(true);
    setHistory(readHistory());
  };

  const showDesktopDropdown = isDropdownOpen;
  const showMobilePanel = isMobileSearchOpen;

  const onLogoClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== "/") return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-border transition-colors duration-200 ${isScrolled ? "bg-app-bg/85 backdrop-blur-md" : "bg-app-bg"
        }`}
    >
      <div className="mx-auto flex h-[60px] w-full max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Left Section: Logo & Nav (Weight 1) */}
        <div className="flex-shrink-0 flex items-center gap-3 sm:gap-6 min-w-0">
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 group" onClick={onLogoClick}>
            <img
              src="/logo-transparente-lateral.png"
              alt="Bíblia Vive"
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <nav aria-label="Navegação principal" className="hidden h-full items-center gap-4 lg:flex overflow-hidden">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `flex h-full items-center font-sans text-[0.8rem] font-medium transition-colors hover:text-app-text whitespace-nowrap ${isActive ? "text-app-text border-b-2 border-gold" : "text-app-text-muted"
                  }`
                }
                key={item.label}
                to={item.href}
              >
                {t(`nav.${item.href === "/" ? "home" : item.href.slice(1)}` as any, { defaultValue: item.label })}
              </NavLink>
            ))}
            {userRole === "admin" && (
              <NavLink
                className={({ isActive }) =>
                  `flex h-full items-center font-sans text-[0.8rem] font-medium transition-colors hover:text-app-text whitespace-nowrap ${isActive ? "text-app-text border-b-2 border-gold" : "text-app-text-muted"
                  }`
                }
                to="/admin"
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        {/* Center Section: Search Bar (Weight Auto) */}
        <div className="hidden md:flex flex-1 justify-start items-center px-4 lg:px-8" ref={searchWrapperRef}>
          <div className="w-full min-w-[200px] max-w-[360px] relative">
            <form onSubmit={handleSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
              <Input
                aria-autocomplete="list"
                aria-controls="header-search-suggestions"
                aria-describedby="header-search-help"
                aria-expanded={showDesktopDropdown}
                aria-label="Buscar na Bíblia"
                className="h-9 rounded-full border-border bg-app-surface pl-9 w-full"
                onChange={(event) => setQuery(event.target.value)}
                onFocus={openSearch}
                placeholder="Buscar capitulo, versículo ou tema..."
                ref={inputRef}
                role="combobox"
                value={query}
              />
              <span className="sr-only" id="header-search-help">
                Digite um versículo como Jo 3:16 ou busque por palavras
              </span>
            </form>

            {showDesktopDropdown && (
              <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-border bg-app-surface p-2 shadow-md" id="header-search-suggestions" role="listbox">
                {parsedReference && (
                  <button
                    className="mb-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-app-text hover:bg-app-raised"
                    onClick={goToReference}
                    role="option"
                    type="button"
                  >
                    {t("search.goTo", { reference: parsedReferenceLabel })}
                  </button>
                )}

                {history.length > 0 ? (
                  <div className="space-y-1">
                    {history.map((item) => (
                      <button
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-app-text-muted hover:bg-app-raised hover:text-app-text"
                        key={item}
                        onClick={() => {
                          setQuery(item);
                          runSearch(item);
                        }}
                        role="option"
                        type="button"
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                        {item}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-xs text-app-text-muted">{t("search.noRecentHistory")}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Controls (Weight 1) */}
        <div className="flex-shrink-0 flex items-center justify-end gap-1.5 min-w-0">
          {/* Mobile: Search icon (only when menu closed) */}
          {!isMobileMenuOpen && (
            <button
              aria-label="Abrir busca"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-app-surface text-app-text md:hidden transition-colors hover:bg-app-raised"
              onClick={() => {
                setIsMobileSearchOpen((value) => !value);
                setHistory(readHistory());
              }}
              type="button"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Mobile: Hamburger button */}
          <button
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-app-surface text-app-text md:hidden transition-colors hover:bg-app-raised"
            onClick={() => {
              setIsMobileMenuOpen((v) => !v);
              setIsMobileSearchOpen(false);
            }}
            type="button"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-1.5">
            {/* Pro Badge or Upgrade Button */}
            {!proLoading && (
              isPro ? (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-full select-none cursor-default">
                  <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
                  </svg>
                  <span className="text-xs font-serif font-medium text-gold tracking-wide">PRO</span>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/pro")}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-app-raised hover:bg-gold/10 border border-border hover:border-gold/30 rounded-full transition-colors group flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5 text-app-text-muted group-hover:text-gold transition-colors" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
                  </svg>
                  <span className="text-xs font-medium text-app-text-muted group-hover:text-gold transition-colors tracking-wide">Premium</span>
                </button>
              )
            )}

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="hidden xl:block text-xs text-app-text-muted max-w-[100px] truncate mr-1">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <NavLink
                  to="/conta"
                  className={({ isActive }) =>
                    `hidden md:inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors ${isActive
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-border bg-app-surface text-app-text hover:bg-app-raised"
                    }`
                  }
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Minha Conta
                </NavLink>
                <button
                  aria-label="Sair da conta"
                  title="Sair"
                  onClick={() => signOut()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-app-surface text-app-text transition-colors hover:bg-red-500/10 hover:text-red-400 hover:border-red-400"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                aria-label="Entrar na conta"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gold/50 bg-transparent px-3 text-xs font-medium text-gold transition-colors hover:bg-gold-bg flex-shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Entrar</span>
              </button>
            )}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <VersionSelector />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        hint="Salve seu progresso de leitura na nuvem."
      />

      {/* Mobile Search Panel */}
      {showMobilePanel && !isMobileMenuOpen && (
        <div className="border-t border-border bg-app-surface p-3 md:hidden" ref={searchWrapperRef}>
          <form className="relative" onSubmit={handleSubmit}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
            <Input
              aria-label="Buscar na Bíblia"
              className="h-10 rounded-full border-border bg-app-raised pl-9"
              onChange={(event) => setQuery(event.target.value)}
              onFocus={openSearch}
              placeholder="Buscar"
              ref={inputRef}
              value={query}
            />
          </form>

          <div className="mt-2 space-y-1">
            {parsedReference && (
              <button
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-app-text hover:bg-app-raised"
                onClick={goToReference}
                type="button"
              >
                {t("search.goTo", { reference: parsedReferenceLabel })}
              </button>
            )}

            {history.length > 0 ? (
              history.map((item) => (
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-app-text-muted hover:bg-app-raised"
                  key={item}
                  onClick={() => {
                    setQuery(item);
                    runSearch(item);
                  }}
                  type="button"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  {item}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-app-text-muted">{t("search.noRecentHistory")}</p>
            )}
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-app-text-muted hover:bg-app-raised"
              onClick={() => setIsMobileSearchOpen(false)}
              type="button"
            >
              <SearchX className="h-3.5 w-3.5" />
              {t("search.closeSearch")}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <nav
          aria-label="Menu mobile"
          className="border-t border-border bg-app-surface divide-y divide-border md:hidden"
        >
          {/* Nav links */}
          <div className="py-2 px-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? "bg-app-raised text-app-text"
                    : "text-app-text-muted hover:bg-app-raised hover:text-app-text"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {userRole === "admin" && (
              <NavLink
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? "bg-app-raised text-app-text"
                    : "text-app-text-muted hover:bg-app-raised hover:text-app-text"
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </div>

          {/* User actions */}
          <div className="py-2 px-4 space-y-1">
            {user ? (
              <>
                <div className="px-3 py-2 text-xs text-app-text-muted truncate">
                  {user.email}
                </div>
                <NavLink
                  to="/conta"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-app-raised text-app-text"
                      : "text-app-text-muted hover:bg-app-raised hover:text-app-text"
                    }`
                  }
                >
                  <User className="h-4 w-4" />
                  Minha Conta
                </NavLink>
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </button>
              </>
            ) : (
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold hover:bg-gold/10 transition-colors"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                type="button"
              >
                <LogIn className="h-4 w-4" />
                Entrar / Criar conta
              </button>
            )}
            {!isPro && (
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-app-text-muted hover:bg-app-raised hover:text-gold transition-colors"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/pro");
                }}
                type="button"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
                </svg>
                Assinar Premium
              </button>
            )}
          </div>

          {/* Selectors */}
          <div className="py-3 px-7 flex items-center gap-3">
            <LanguageSelector />
            <VersionSelector />
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}