// ─────────────────────────────────────────────────────────────────────────────
// useSectionHeadings.ts — Bíblia Vive
//
// Hook React que carrega os subtítulos de seção para o capítulo atual e
// expõe getHeadingsBeforeVerse() para uso inline no loop de versículos.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import {
  type SectionHeading,
  getHeadingsForChapter,
  getHeadingsBeforeVerse,
} from "@/lib/sectionHeadings";

interface UseSectionHeadingsResult {
  headings: SectionHeading[];
  /** Retorna os subtítulos que devem ser renderizados antes do versículo N */
  getHeadingsBeforeVerse: (verseNumber: number) => SectionHeading[];
}

/**
 * Carrega e expõe os subtítulos de seção para um capítulo.
 *
 * @param bookSlug - slug interno do livro (ex: "gn", "mt")
 * @param chapter  - número do capítulo
 * @param langCode - código de idioma da versão atual (ex: "pt-BR", "en")
 */
export function useSectionHeadings(
  bookSlug: string | undefined,
  chapter: number,
  langCode: string
): UseSectionHeadingsResult {
  const [headings, setHeadings] = useState<SectionHeading[]>([]);

  useEffect(() => {
    if (!bookSlug) {
      setHeadings([]);
      return;
    }

    let cancelled = false;

    getHeadingsForChapter(bookSlug, chapter, langCode).then((result) => {
      if (!cancelled) setHeadings(result);
    });

    return () => {
      cancelled = true;
    };
  }, [bookSlug, chapter, langCode]);

  const getBeforeVerse = useCallback(
    (verseNumber: number) => getHeadingsBeforeVerse(headings, verseNumber),
    [headings]
  );

  return {
    headings,
    getHeadingsBeforeVerse: getBeforeVerse,
  };
}
