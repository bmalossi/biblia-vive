import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { findBookBySlug, getTestament } from "@/lib/books";
import { getVersion, isBibleVersion } from "@/lib/themes";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTranslation } from "@/i18n";
import { Link, useParams } from "react-router-dom";

export default function BookPage() {
  const { version, book } = useParams();
  const selectedVersion = isBibleVersion(version) ? version : getVersion();
  const selectedBook = findBookBySlug(book);
  const { t } = useTranslation();

  const title = selectedBook ? `${selectedBook.name} — ${selectedVersion.toUpperCase()} — Bíblia Vive` : `Livro não encontrado — Bíblia Vive`;
  const description = selectedBook ? `Leia o livro de ${selectedBook.name} completo na versão ${selectedVersion.toUpperCase()}. São ${selectedBook.chapters} capítulos do ${getTestament(selectedBook)} para seu estudo bíblico online.` : "O livro solicitado não pôde ser encontrado.";
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
        "inLanguage": "pt-BR"
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

  return (
    <Layout>
      <p className="font-sans text-xs uppercase tracking-[0.08em] text-app-text-muted">
        Livros › {selectedBook.name} ({selectedVersion.toUpperCase()})
      </p>

      <h1 className="mt-2 text-4xl text-app-text">{selectedBook.name}</h1>
      <p className="mt-2 font-sans text-sm text-app-text-muted">
        {selectedBook.chapters} capítulos · {getTestament(selectedBook)}
      </p>

      <section className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(56px,1fr))]">
        {Array.from({ length: selectedBook.chapters }, (_, index) => index + 1).map((chapter) => (
          <Link
            className="flex h-12 items-center justify-center rounded-lg border border-border bg-app-raised font-sans text-sm text-app-text transition-colors hover:border-gold hover:bg-gold-bg"
            key={chapter}
            to={`/${selectedVersion}/${selectedBook.slug}/${chapter}`}
          >
            {chapter}
          </Link>
        ))}
      </section>
    </Layout>
  );
}