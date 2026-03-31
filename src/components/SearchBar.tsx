import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getVersion } from "@/lib/themes";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { findBookBySlug } from "@/lib/books";

const quickSearches = [
  { slug: "joa", chapter: 3, verse: 16 },
  { slug: "sl", chapter: 23 },
  { slug: "rm", chapter: 8 },
  { slug: "pv", chapter: 3, verse: 5 },
  { slug: "hb", chapter: 11 },
];

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { locale, t } = useTranslation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/busca?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="mt-8 text-center">
      <form className="mx-auto flex w-full max-w-[480px] items-center gap-2" onSubmit={handleSubmit}>
        <Input
          aria-label={t("nav.search")}
          className="h-11 rounded-full border-border bg-app-raised px-5 text-sm text-app-text placeholder:text-app-text-muted"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.inputPlaceholder")}
          value={query}
        />
        <Button className="h-11 rounded-full px-5" type="submit">
          {t("nav.search")}
        </Button>
      </form>

      <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
        {quickSearches.map((item) => {
          const book = findBookBySlug(item.slug, locale);
          const label = `${book?.name} ${item.chapter}${item.verse ? `:${item.verse}` : ""}`;
          return (
            <button
              className="rounded-full border border-border bg-app-surface px-3 py-1.5 font-sans text-[0.72rem] text-app-text-muted transition-colors hover:border-gold hover:bg-gold-bg hover:text-app-text"
              key={item.slug}
              onClick={() => navigate(`/${getVersion()}/${item.slug}/${item.chapter}`)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}