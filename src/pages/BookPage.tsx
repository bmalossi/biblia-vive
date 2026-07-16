import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { findBookBySlug, getTestament } from "@/lib/books";
import { getVersion, isBibleVersion } from "@/lib/themes";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTranslation } from "@/i18n";
import { Link, useParams } from "react-router-dom";
import bookContextsData from "@/data/book-contexts.json";

export default function BookPage() {
  const { version, book } = useParams();
  const selectedVersion = isBibleVersion(version) ? version : getVersion();
  const selectedBook = findBookBySlug(book);
  const { t } = useTranslation();

  // Busca o contexto do livro de forma síncrona (import estático = SEO-friendly)
  const bookCtx = selectedBook
    ? (bookContextsData as Record<string, any>)[selectedBook.id.toUpperCase()]
    : null;

  const title = selectedBook ? `${selectedBook.name} — ${selectedVersion.toUpperCase()} — Bíblia Vive` : `Livro não encontrado — Bíblia Vive`;
  const description = selectedBook
    ? bookCtx?.theme
      ? `${selectedBook.name}: ${bookCtx.theme}. Leia os ${selectedBook.chapters} capítulos na versão ${selectedVersion.toUpperCase()}.`
      : `Leia o livro de ${selectedBook.name} completo na versão ${selectedVersion.toUpperCase()}. São ${selectedBook.chapters} capítulos do ${getTestament(selectedBook)} para seu estudo bíblico online.`
    : "O livro solicitado não pôde ser encontrado.";
  const robots = selectedBook ? undefined : "noindex, nofollow";

  usePageMeta({
    title,
    description,
    robots,
    canonical: `/${selectedVersion}/${selectedBook?.slug ?? ""}`,
    ogImage: "/og-default.png",
    ogType: "website",
    jsonLd: selectedBook ? [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": window.location.origin },
          { "@type": "ListItem", "position": 2, "name": selectedBook.name, "item": `${window.location.origin}/${selectedVersion}/${selectedBook.slug}` }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": selectedBook.name,
        "numberOfPages": selectedBook.chapters,
        "inLanguage": "pt-BR",
        ...(bookCtx?.author ? { "author": { "@type": "Person", "name": bookCtx.author } } : {}),
        ...(bookCtx?.theme ? { "description": bookCtx.theme } : {}),
      }
    ] : undefined
  });

  if (!selectedBook) {
    return (
      <Layout>
        <div className="rounded-xl border border-border bg-app-surface p-6 text-center">
          <p className="font-sans text-sm text-app-text-muted">Livro não encontrado.</p>
          <Button asChild className="mt-4">
            <Link to="/">Voltar para a página inicial</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const testamentLabel = getTestament(selectedBook) === "old" ? "Antigo Testamento" : "Novo Testamento";

  return (
    <Layout>
      <p className="font-sans text-xs uppercase tracking-[0.08em] text-app-text-muted">
        Livros › {selectedBook.name} ({selectedVersion.toUpperCase()})
      </p>

      <h1 className="mt-2 text-4xl text-app-text">{selectedBook.name}</h1>
      <p className="mt-2 font-sans text-sm text-app-text-muted">
        {selectedBook.chapters} capítulos · {testamentLabel}
        {bookCtx?.genre ? ` · ${bookCtx.genre}` : ""}
      </p>

      {/* Grade de capítulos */}
      <section
        aria-label={`Capítulos de ${selectedBook.name}`}
        className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(56px,1fr))]"
      >
        {Array.from({ length: selectedBook.chapters }, (_, index) => index + 1).map((chapter) => (
          <Link
            className="flex h-12 items-center justify-center rounded-lg border border-border bg-app-raised font-sans text-sm text-app-text transition-colors hover:border-gold hover:bg-gold hover:text-primary-foreground"
            key={chapter}
            to={`/${selectedVersion}/${selectedBook.slug}/${chapter}`}
          >
            {chapter}
          </Link>
        ))}
      </section>

      {/* Divisor + Contexto do livro */}
      {bookCtx && (
        <>
          <hr className="mt-10 border-border" />

          <section aria-label={`Contexto de ${selectedBook.name}`} className="mt-8 space-y-6">
            <h2 className="font-sans text-xs uppercase tracking-[0.12em] text-gold">
              Sobre {selectedBook.name}
            </h2>

            {/* Tema Central */}
            {bookCtx.theme && (
              <div>
                <p className="mb-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                  Tema Central
                </p>
                <p className="font-sans text-sm leading-relaxed text-app-text">
                  {bookCtx.theme}
                </p>
              </div>
            )}

            {/* Contexto Histórico */}
            {bookCtx.summary && (
              <div>
                <p className="mb-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                  Contexto Histórico
                </p>
                <p className="font-sans text-sm leading-relaxed text-app-text-muted">
                  {bookCtx.summary}
                </p>
              </div>
            )}

            {/* Metadados: Autor, Período, Gênero, Público */}
            <div className="rounded-lg border border-border bg-app-raised px-4 py-3">
              <dl className="space-y-2">
                {bookCtx.author && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[0.58rem] uppercase tracking-widest text-app-text-muted shrink-0">
                      Autor
                    </dt>
                    <dd className="font-sans text-[0.78rem] text-app-text text-right">
                      {bookCtx.author}
                    </dd>
                  </div>
                )}
                {bookCtx.period_written && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[0.58rem] uppercase tracking-widest text-app-text-muted shrink-0">
                      Período
                    </dt>
                    <dd className="font-sans text-[0.78rem] text-app-text text-right">
                      {bookCtx.period_written}
                    </dd>
                  </div>
                )}
                {bookCtx.period_events && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[0.58rem] uppercase tracking-widest text-app-text-muted shrink-0">
                      Eventos
                    </dt>
                    <dd className="font-sans text-[0.78rem] text-app-text text-right">
                      {bookCtx.period_events}
                    </dd>
                  </div>
                )}
                {bookCtx.genre && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[0.58rem] uppercase tracking-widest text-app-text-muted shrink-0">
                      Gênero
                    </dt>
                    <dd className="font-sans text-[0.78rem] text-app-text text-right">
                      {bookCtx.genre}
                    </dd>
                  </div>
                )}
                {bookCtx.audience && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[0.58rem] uppercase tracking-widest text-app-text-muted shrink-0">
                      Público
                    </dt>
                    <dd className="font-sans text-[0.78rem] text-app-text text-right">
                      {bookCtx.audience}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Temas-chave */}
            {bookCtx.key_themes && bookCtx.key_themes.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                  Temas-chave
                </p>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Temas-chave">
                  {(bookCtx.key_themes as string[]).map((tema) => (
                    <span
                      key={tema}
                      role="listitem"
                      className="rounded-full border border-border bg-app-raised px-3 py-1 font-sans text-[0.72rem] text-app-text-muted"
                    >
                      {tema}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pessoas e Lugares-chave (se disponíveis) */}
            {(bookCtx.key_people?.length > 0 || bookCtx.key_places?.length > 0) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {bookCtx.key_people?.length > 0 && (
                  <div>
                    <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                      Pessoas-chave
                    </p>
                    <ul className="space-y-0.5">
                      {(bookCtx.key_people as string[]).map((pessoa) => (
                        <li
                          key={pessoa}
                          className="font-sans text-[0.78rem] text-app-text-muted before:mr-2 before:text-gold before:content-['·']"
                        >
                          {pessoa}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {bookCtx.key_places?.length > 0 && (
                  <div>
                    <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                      Lugares-chave
                    </p>
                    <ul className="space-y-0.5">
                      {(bookCtx.key_places as string[]).map((lugar) => (
                        <li
                          key={lugar}
                          className="font-sans text-[0.78rem] text-app-text-muted before:mr-2 before:text-gold before:content-['·']"
                        >
                          {lugar}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}