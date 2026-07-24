import { Link } from "react-router-dom";
import { useEditorialChapter } from "@/hooks/useEditorialChapter";
import {
  getEditorialChapterLink,
  getEditorialChapterReferenceText,
} from "@/types/editorialChapter";

export default function CapituloDeHojeSection() {
  const { chapter, loading } = useEditorialChapter();

  if (loading) {
    return (
      <section className="mx-auto my-12 max-w-2xl px-6 text-center">
        <div className="mx-auto h-4 w-36 animate-pulse rounded bg-app-raised mb-6" />
        <div className="mx-auto h-8 w-3/4 animate-pulse rounded bg-app-raised mb-6" />
        <div className="mx-auto h-20 w-full animate-pulse rounded bg-app-raised mb-6" />
        <div className="mx-auto h-10 w-44 animate-pulse rounded-full bg-app-raised" />
      </section>
    );
  }

  if (!chapter) {
    return null;
  }

  const targetLink = getEditorialChapterLink(chapter);
  const referenceText = getEditorialChapterReferenceText(chapter);
  const paragraphs = chapter.intro_text.split("\n\n").filter(Boolean);

  return (
    <section className="mx-auto my-14 max-w-2xl px-6 text-center">
      {/* Título de Seção & Identificador Discreto */}
      <div className="mb-6 space-y-1">
        <h2 className="font-sans text-[0.7rem] uppercase tracking-[0.22em] text-app-text-muted font-medium">
          Capítulo de Hoje
        </h2>
        <p className="font-mono text-[0.75rem] tracking-wider text-gold">
          Capítulo {chapter.chapter_number} · {chapter.series_name}
        </p>
      </div>

      {/* Título Principal em Destaque */}
      <h3 className="font-serif text-2xl md:text-3xl font-normal leading-snug text-app-text mb-8">
        {chapter.title}
      </h3>

      {/* Texto Introdutório (2 ou 3 parágrafos curtos) */}
      <div className="mb-10 space-y-5 text-left md:text-center text-app-text-muted font-sans text-base md:text-[1.05rem] leading-relaxed">
        {paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>

      {/* Convite & Botão para Leitura */}
      <div className="inline-flex flex-col items-center pt-2">
        <p className="font-serif text-lg text-app-text italic mb-5">
          Hoje, leia {referenceText}.
        </p>
        <Link
          to={targetLink}
          className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-sm font-medium text-black transition-all hover:bg-gold/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gold/50 active:scale-[0.98]"
        >
          Ler {referenceText} &rarr;
        </Link>
      </div>
    </section>
  );
}
