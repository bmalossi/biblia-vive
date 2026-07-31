import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import VersionSelector from "@/components/VersionSelector";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatParsedReferenceLabel, parseReference } from "@/lib/referenceParser";
import { getVersion, getTheme, type Theme } from "@/lib/themes";
import {
  BookOpen,
  Clock3,
  HelpCircle,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Search,
  SearchX,
  Settings,
  User,
  Heart,
  FileText,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { Link, NavLink } from "react-router-dom";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Location, useLocation, useNavigate } from "react-router-dom";
import PwaInstallCard from "@/components/PwaInstallCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Leitura", href: "/" },
  { label: "Jornadas", href: "/jornadas" },
  { label: "Planos", href: "/planos" },
  { label: "Memorial", href: "/memorial" },
  { label: "Harpa", href: "/harpa" },
];

const HISTORY_KEY = "bv_search_history";

// ─── Search history helpers ───────────────────────────────────────────────────

const readHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const saveHistoryItem = (term: string) => {
  if (!term.trim()) return;
  const unique = [
    term.trim(),
    ...readHistory().filter((item) => item.toLowerCase() !== term.trim().toLowerCase()),
  ].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(unique));
};

// ─── Star icon (reused for PRO) ───────────────────────────────────────────────

const StarIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isPending } = useAuth();
  const { isPro, loading: proLoading } = useSubscription();
  const userRole = (user?.app_metadata as any)?.role;

  const [isScrolled, setIsScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  const [stickyTitle, setStickyTitle] = useState<{ title: string; visible: boolean }>({ title: "", visible: false });
  const [scrollProgress, setScrollProgress] = useState<number | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(() => localStorage.getItem("bv_focus_mode") === "true");

  const inputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const parsedReference = useMemo(() => parseReference(query), [query]);
  const parsedReferenceLabel = useMemo(
    () => (parsedReference ? formatParsedReferenceLabel(parsedReference) : ""),
    [parsedReference],
  );

  // Display name / initial for avatar
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "U";
  const avatarInitial = displayName[0].toUpperCase();

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll);

    const handleThemeChange = () => setTheme(getTheme());
    window.addEventListener("bv-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("bv-theme-change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const handleStickyTitle = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; visible: boolean }>;
      setStickyTitle(customEvent.detail);
    };

    const handleScrollProgress = (e: Event) => {
      const customEvent = e as CustomEvent<{ progress: number }>;
      setScrollProgress(customEvent.detail.progress);
    };

    const handlePreferenceChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value: any }>;
      if (customEvent.detail.key === "focusMode") {
        setIsFocusMode(customEvent.detail.value);
      }
    };

    window.addEventListener("bv-sticky-title", handleStickyTitle);
    window.addEventListener("bv-scroll-progress", handleScrollProgress);
    window.addEventListener("bv-preference-change", handlePreferenceChange);

    return () => {
      window.removeEventListener("bv-sticky-title", handleStickyTitle);
      window.removeEventListener("bv-scroll-progress", handleScrollProgress);
      window.removeEventListener("bv-preference-change", handlePreferenceChange);
    };
  }, []);

  useEffect(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const isReadingPath = pathParts.length === 3 && ["acf", "nvi", "arc", "kja", "aa", "kjv", "bbe", "rvr"].includes(pathParts[0].toLowerCase());
    
    if (!isReadingPath) {
      setStickyTitle({ title: "", visible: false });
      setScrollProgress(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === "/busca") {
      setQuery(params.get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.id]);

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

  // ── Handlers ─────────────────────────────────────────────────────────────────

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

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
    if (location.pathname === "/conta" || location.pathname === "/admin") {
      navigate("/");
    }
  };

  const onLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== "/") return;
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  // ── Sub-components ───────────────────────────────────────────────────────────

  /** Shared avatar circle — used in desktop dropdown trigger and mobile drawer */
  const AvatarCircle = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const cls =
      size === "md"
        ? "h-10 w-10 text-sm"
        : "h-8 w-8 text-[0.65rem]";
    return (
      <span
        className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full border border-border bg-app-surface overflow-hidden ${cls}`}
      >
        {user?.user_metadata?.avatar_url && !avatarError ? (
          <img
            alt={displayName}
            className="h-full w-full object-cover"
            onError={() => setAvatarError(true)}
            referrerPolicy="no-referrer"
            src={user.user_metadata.avatar_url}
          />
        ) : (
          <span className="font-semibold text-app-text select-none">{avatarInitial}</span>
        )}
        {/* PRO dot badge */}
        {isPro && !proLoading && (
          <span
            aria-label="Plano PRO ativo"
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-gold border-2 border-app-bg"
          />
        )}
      </span>
    );
  };

  /** PRO badge pill (desktop inline) */
  const ProBadge = () => (
    <div
      aria-label="Plano PRO ativo"
      className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-full select-none cursor-default"
    >
      <StarIcon className="w-3 h-3 text-gold" />
      <span className="text-[0.7rem] font-semibold text-gold tracking-widest">PRO</span>
    </div>
  );

  /** "Assine PRO" CTA button */
  const ProCtaButton = ({ className = "" }: { className?: string }) => (
    <button
      className={`flex items-center gap-1.5 rounded-full border border-gold/30 bg-transparent px-2.5 py-1 text-xs font-medium text-gold opacity-80 transition-all hover:bg-gold/10 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${className}`}
      onClick={() => navigate("/pro")}
      type="button"
    >
      <StarIcon className="w-3 h-3" />
      Assine PRO
    </button>
  );

  /** Search dropdown suggestions (shared for desktop and mobile panel) */
  const SearchSuggestions = () => (
    <div
      className="mt-2 space-y-1"
      id="header-search-suggestions"
      role="listbox"
    >
      {parsedReference && (
        <button
          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-app-text hover:bg-app-raised"
          onClick={goToReference}
          role="option"
          type="button"
        >
          {t("search.goTo", { reference: parsedReferenceLabel })}
        </button>
      )}
      {history.length > 0 ? (
        history.map((item) => (
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
            <Clock3 className="h-3.5 w-3.5 flex-shrink-0" />
            {item}
          </button>
        ))
      ) : (
        <p className="px-3 py-2 text-xs text-app-text-muted">
          {t("search.noRecentHistory")}
        </p>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isFocusMode) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-app-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-4 md:h-[60px] md:px-6">
          {/* LEFT: Logo + Chapter Title (Permanent) */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link className="flex-shrink-0 flex items-center gap-2 group" onClick={onLogoClick} to="/">
              <img
                alt="Bíblia Vive"
                width="160"
                height="32"
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                src={theme === "dark" ? "/logo-biblia-branco-fundo-transparente.webp" : "/logo-transparente-lateral.webp"}
              />
            </Link>
            {stickyTitle.title && (
              <span className="inline-flex items-center gap-1.5 text-sm md:text-base font-serif font-semibold text-app-text animate-fade-in max-w-[140px] sm:max-w-none truncate">
                <span className="text-border select-none">/</span>
                {stickyTitle.title}
              </span>
            )}
          </div>

          {/* RIGHT: Exit Focus Mode Button */}
          <button
            type="button"
            className="text-xs text-app-text-muted hover:text-app-text rounded-full hover:bg-app-surface px-3 py-1.5 border border-border/50 transition-colors"
            onClick={() => {
              localStorage.setItem("bv_focus_mode", "false");
              window.dispatchEvent(new CustomEvent("bv-preference-change", { detail: { key: "focusMode", value: false } }));
            }}
          >
            {t("reading.exitFocus")}
          </button>
        </div>

        {/* Bottom progress bar */}
        {scrollProgress !== null && (
          <div
            className="absolute bottom-0 left-0 h-[2px] bg-gold transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        )}
      </header>
    );
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-border transition-colors duration-200 ${isScrolled ? "bg-app-bg/85 backdrop-blur-md" : "bg-app-bg"
        }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-4 md:h-[60px] md:px-6">

        {/* ── LEFT: Logo + Nav ────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0 items-center gap-4 md:gap-6">
          <Link
            className="flex-shrink-0 flex items-center gap-2 group"
            onClick={onLogoClick}
            to="/"
          >
            <img
              alt="Bíblia Vive"
              width="160"
              height="32"
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
              src={theme === "dark" ? "/logo-biblia-branco-fundo-transparente.webp" : "/logo-transparente-lateral.webp"}
            />
          </Link>

          {stickyTitle.visible && stickyTitle.title && (
            <span className="inline-flex items-center gap-1.5 text-sm md:text-base font-serif font-semibold text-app-text animate-fade-in max-w-[140px] sm:max-w-none truncate">
              <span className="text-border select-none">/</span>
              {stickyTitle.title}
            </span>
          )}

          <nav aria-label="Navegação principal" className="hidden lg:flex h-full items-center gap-5">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `flex h-full items-center text-sm font-medium transition-colors hover:text-app-text whitespace-nowrap ${isActive
                    ? "text-app-text border-b-2 border-gold"
                    : "text-app-text-muted"
                  }`
                }
                key={item.label}
                to={item.href}
              >
                {item.label}
              </NavLink>
            ))}
            {userRole === "admin" && (
              <NavLink
                className={({ isActive }) =>
                  `flex h-full items-center text-sm font-medium transition-colors hover:text-app-text whitespace-nowrap ${isActive
                    ? "text-app-text border-b-2 border-gold"
                    : "text-app-text-muted"
                  }`
                }
                to="/admin"
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        {/* ── CENTER: Search Bar (desktop) ────────────────────────────────── */}
        <div className="hidden md:flex flex-1 justify-start items-center px-4 lg:px-8" ref={searchWrapperRef}>
          <div className="w-full min-w-[180px] max-w-[400px] relative">
            <form onSubmit={handleSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
              <Input
                aria-autocomplete="list"
                aria-controls="header-search-suggestions"
                aria-describedby="header-search-help"
                aria-expanded={isDropdownOpen}
                aria-label="Buscar na Bíblia"
                className="h-9 rounded-full border-border bg-app-surface pl-9 w-full"
                onChange={(e) => setQuery(e.target.value)}
                onFocus={openSearch}
                placeholder="Jo 3:16, Sl 23, amor, fé…"
                ref={inputRef}
                role="combobox"
                value={query}
              />
              <span className="sr-only" id="header-search-help">
                Digite um versículo como Jo 3:16 ou busque por palavras
              </span>
            </form>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-border bg-app-surface p-2 shadow-md">
                <SearchSuggestions />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Controls ─────────────────────────────────────────────── */}
        {/* Como usar — desktop link, right of search bar */}
        <Link
          to="/como-usar"
          className="hidden lg:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-text-muted transition-colors hover:bg-app-raised hover:text-app-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          aria-label="Como usar o Bíblia Vive"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Como usar
        </Link>

        <div className="flex flex-shrink-0 items-center gap-2">

          {/* PRO badge or CTA — visible from md: */}
          {!proLoading && (
            <>
              {isPro ? (
                <ProBadge />
              ) : (
                <ProCtaButton className="hidden md:flex" />
              )}
            </>
          )}

          <Link
            to="/apoiar"
            className="hidden md:inline-flex h-7 items-center gap-1 rounded-full border border-gold/30 bg-transparent px-2.5 text-xs font-medium text-gold opacity-80 transition-all hover:bg-gold hover:text-primary-foreground hover:border-gold hover:opacity-100 flex-shrink-0"
          >
            <Heart className="h-3 w-3" />
            Apoiar
          </Link>

          {/* Account dropdown (desktop, logged in) */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Menu da conta"
                  className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border hover:border-gold/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <AvatarCircle size="sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs font-semibold text-app-text truncate">{displayName}</p>
                  <p className="text-xs text-app-text-muted truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={() => navigate("/conta")}
                >
                  <User className="h-4 w-4" />
                  Minha Conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Selectors inside dropdown */}
                <div className="px-2 py-1 flex items-center gap-2">
                  <LanguageSelector />
                  <VersionSelector />
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-red-400 focus:text-red-400"
                  disabled={isPending}
                  onSelect={handleSignOut}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Login button (desktop, not logged in) */}
          {!user && (
            <button
              aria-label="Entrar na conta"
              className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-transparent px-3 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-raised hover:text-app-text flex-shrink-0"
              onClick={() => setAuthModalOpen(true)}
              type="button"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </button>
          )}

          {/* Theme toggle always visible on desktop (outside dropdown for quick access) */}
          {!user && (
            <div className="hidden md:flex items-center gap-1.5">
              <VersionSelector />
              <ThemeToggle />
            </div>
          )}

          {/* Mobile: Apoiar icon */}
          {!isMobileMenuOpen && (
            <Link
              to="/apoiar"
              aria-label="Apoiar o projeto"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-gold md:hidden transition-colors hover:bg-gold hover:text-primary-foreground hover:border-gold"
            >
              <Heart className="h-4 w-4" />
            </Link>
          )}

          {/* Mobile: search icon */}
          {!isMobileMenuOpen && (
            <button
              aria-label="Abrir busca"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-app-surface text-app-text md:hidden transition-colors hover:bg-app-raised"
              onClick={() => {
                setIsMobileSearchOpen((v) => !v);
                setHistory(readHistory());
              }}
              type="button"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Mobile: Hamburger — uses Sheet (right drawer) */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={isMobileMenuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-app-surface text-app-text md:hidden transition-colors hover:bg-app-raised"
                type="button"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex flex-col gap-0 p-0 bg-app-bg border-l border-border w-[280px]"
            >
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              {/* ── Drawer header ── */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <img
                    alt="Bíblia Vive"
                    width="140"
                    height="28"
                    className="h-7 w-auto"
                    src={theme === "dark" ? "/logo-biblia-branco-fundo-transparente.webp" : "/logo-transparente-lateral.webp"}
                  />
                </Link>
              </div>

              {/* ── PRO CTA or status (top of drawer) ── */}
              {!proLoading && (
                <div className="px-4 pt-4 pb-2">
                  {isPro ? (
                    <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/25 px-3 py-2.5">
                      <StarIcon className="h-4 w-4 text-gold flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gold">Você é PRO ✦</p>
                        <p className="text-xs text-app-text-muted">Obrigado por apoiar!</p>
                      </div>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <button
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-transparent px-4 py-2 text-sm font-medium text-gold opacity-80 shadow-sm transition-all hover:bg-gold/10 hover:opacity-100"
                        onClick={() => navigate("/pro")}
                        type="button"
                      >
                        <StarIcon className="h-4 w-4" />
                        Assine PRO
                      </button>
                    </SheetClose>
                  )}
                </div>
              )}

              {/* ── Nav links ── */}
              <div className="px-3 py-2 border-t border-border">
                <p className="px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-app-text-muted">
                  Navegar
                </p>
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
                    <BookOpen className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/artigos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-app-raised text-app-text"
                      : "text-app-text-muted hover:bg-app-raised hover:text-app-text"
                    }`
                  }
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  Artigos
                </NavLink>
                {/* Como usar — mobile drawer */}
                <NavLink
                  to="/como-usar"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-app-raised text-app-text"
                      : "text-app-text-muted hover:bg-app-raised hover:text-app-text"
                    }`
                  }
                >
                  <HelpCircle className="h-4 w-4 flex-shrink-0" />
                  Como usar
                </NavLink>
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

              {/* ── Install PWA Card ── */}
              <PwaInstallCard variant="drawer" />

              {/* ── Account section ── */}
              <div className="px-3 py-2 border-t border-border">
                <p className="px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-app-text-muted">
                  Conta
                </p>
                {user ? (
                  <>
                    {/* User identity row */}
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                      <AvatarCircle size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-app-text truncate">{displayName}</p>
                        <p className="text-xs text-app-text-muted truncate">{user.email}</p>
                      </div>
                      {isPro && !proLoading && (
                        <span className="ml-auto flex-shrink-0 flex items-center gap-0.5 rounded-full bg-gold/15 border border-gold/25 px-2 py-0.5 text-[0.6rem] font-bold text-gold tracking-widest">
                          <StarIcon className="h-2.5 w-2.5" /> PRO
                        </span>
                      )}
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
                      <User className="h-4 w-4 flex-shrink-0" />
                      Minha Conta
                    </NavLink>

                    <button
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      disabled={isPending}
                      onClick={handleSignOut}
                      type="button"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                      )}
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
                    <LogIn className="h-4 w-4 flex-shrink-0" />
                    Entrar ou criar conta
                  </button>
                )}
              </div>

              {/* ── Settings ── */}
              <div className="px-3 py-2 border-t border-border mt-auto">
                <p className="px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-app-text-muted">
                  <Settings className="inline h-3 w-3 mr-1 -mt-0.5" />
                  Configurações
                </p>
                <div className="flex flex-wrap items-center gap-3 px-3 py-3 pb-6">
                  <LanguageSelector />
                  <VersionSelector />
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Auth Modal ─────────────────────────────────────────────────────── */}
      <AuthModal
        hint="Salve seu progresso de leitura na nuvem."
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* ── Mobile Search Panel ────────────────────────────────────────────── */}
      {isMobileSearchOpen && !isMobileMenuOpen && (
        <div className="border-t border-border bg-app-surface p-3 md:hidden" ref={searchWrapperRef}>
          <form className="relative" onSubmit={handleSubmit}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
            <Input
              aria-label="Buscar na Bíblia"
              className="h-10 rounded-full border-border bg-app-raised pl-9"
              onChange={(e) => setQuery(e.target.value)}
              onFocus={openSearch}
              placeholder="Buscar versículo ou tema"
              ref={inputRef}
              value={query}
            />
          </form>

          <SearchSuggestions />

          <button
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-app-text-muted hover:bg-app-raised"
            onClick={() => setIsMobileSearchOpen(false)}
            type="button"
          >
            <SearchX className="h-3.5 w-3.5" />
            {t("search.closeSearch")}
          </button>
        </div>
      )}
      {scrollProgress !== null && (
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gold transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      )}
    </header>
  );
}