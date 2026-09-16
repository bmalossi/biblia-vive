// ─────────────────────────────────────────────────────────────────────────────
// harpaUtils.ts — Bíblia Vive
// Utilitários, tipagens e metadados enriquecidos para os hinos da Harpa Cristã.
// ─────────────────────────────────────────────────────────────────────────────

export interface HarpaHymn {
  numero: number;
  titulo: string;
  tituloFormatado: string;
  estrofes: number;
  hasAudio: boolean;
  audioFile: string | null;
}

export interface HymnRatingData {
  rating: string;
  reviewsCount: string;
  tags?: string[];
  description?: string;
}

// Metadados específicos e temáticos para os hinos proeminentes (notas zeradas pois ainda não há votação de usuários)
const CURATED_HYMN_METADATA: Record<number, Partial<HymnRatingData>> = {
  1: {
    rating: "0",
    reviewsCount: "0",
    tags: ["Louvor", "Graça", "Vida Cristã"],
    description:
      "Um dos hinos mais conhecidos da Harpa Cristã, que fala sobre o poder transformador da graça de Deus.",
  },
  2: { rating: "0", reviewsCount: "0", tags: ["Comunhão", "Esperança"] },
  3: { rating: "0", reviewsCount: "0", tags: ["Paz", "Segurança"] },
  4: { rating: "0", reviewsCount: "0", tags: ["Providência", "Fé"] },
  5: { rating: "0", reviewsCount: "0", tags: ["Avivamento", "Espírito Santo"] },
  6: { rating: "0", reviewsCount: "0", tags: ["Salvação", "Convite"] },
  7: { rating: "0", reviewsCount: "0", tags: ["Redenção", "Gratidão"] },
  8: { rating: "0", reviewsCount: "0", tags: ["Alegria", "Salvação"] },
  9: { rating: "0", reviewsCount: "0", tags: ["Conversão", "Fé"] },
  10: { rating: "0", reviewsCount: "0", tags: ["Despertar", "Vigilância"] },
  11: { rating: "0", reviewsCount: "0", tags: ["Batalha", "Fidelidade"] },
  12: { rating: "0", reviewsCount: "0", tags: ["Louvor", "Adoração"] },
  13: { rating: "0", reviewsCount: "0", tags: ["Redenção", "Graça"] },
  14: { rating: "0", reviewsCount: "0", tags: ["Ceia", "Comunhão"] },
  15: { rating: "0", reviewsCount: "0", tags: ["Conversão", "Vida Nova"] },
};

/**
 * Retorna true se a nota for válida e tiver pelo menos 1 estrela (nota >= 1).
 * Garante que somente informações verdadeiras e verificadas sejam exibidas.
 */
export function hasValidRating(rating?: string | number | null): boolean {
  if (!rating) return false;
  const num = typeof rating === "string" ? parseFloat(rating) : rating;
  return !isNaN(num) && num >= 1;
}

/**
 * Retorna avaliação e contagem de votos para qualquer hino.
 * Notas iniciam em '0' para manter integridade com as avaliações reais dos fiéis.
 */
export function getHymnRatingData(hymnNumber: number): HymnRatingData {
  const curated = CURATED_HYMN_METADATA[hymnNumber];

  return {
    rating: curated?.rating ?? "0",
    reviewsCount: curated?.reviewsCount ?? "0",
    tags: curated?.tags ?? ["Louvor", "Adoração"],
    description: curated?.description ?? "Hino tradicional de louvor e adoração a Deus.",
  };
}

/**
 * Formata o número do hino com 3 dígitos (ex: 1 -> "001", 12 -> "012")
 */
export function formatHymnNumber(num: number): string {
  return String(num).padStart(3, "0");
}
