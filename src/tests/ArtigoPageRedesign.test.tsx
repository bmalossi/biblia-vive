import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ArtigoPage from "@/pages/ArtigoPage";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock usePageMeta
vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: vi.fn(),
}));

// Mock Header
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("@/components/HarpaPlayerBar", () => ({
  default: () => null,
}));

vi.mock("@/components/NotificationSoftAsk", () => ({
  default: () => null,
}));

// Mock Supabase
const mockArticle = {
  id: "article-1",
  title: "Não corra atrás de profetas: busque a Deus e cuidado com os falsos profetas",
  slug: "cuidado-com-falsos-profetas",
  body: `Em um mundo onde tantas vozes se levantam, é fácil se deixar confundir. O desejo de ouvir de Deus é legítimo, mas também existe um grande risco: o de buscar respostas em lugares errados.

> "O Senhor é a minha força e o meu escudo; nele o meu coração confia, e dele recebo ajuda."
> Salmo 28:7

## O que a Bíblia nos ensina

Deus sempre se revela de forma clara, constante e coerente com a Sua Palavra. Ele não muda. Por isso, o nosso coração precisa estar enraizado nas Escrituras.

## Busque a Deus, não os homens

Quando colocamos Deus em primeiro lugar, não precisamos correr atrás de profetas, gurus ou líderes que prometem respostas fáceis.`,
  status: "publicado",
  meta_title: "Não corra atrás de profetas | Bíblia Vive",
  meta_description:
    "A Bíblia nos ensina a discernir entre a verdadeira voz de Deus e as vozes enganosas que se levantam no meio de nós.",
  cover_image_url: null,
  created_at: "2026-09-10T12:00:00Z",
  published_at: "2026-09-10T12:00:00Z",
  author: {
    id: "author-1",
    name: "Bruno Malossi",
    slug: "bruno-malossi",
    avatar_url: null,
    bio: "Recebeu de Deus um computador, capacidade intelectual e vontade para entregar o que escrevo às pessoas. Estou entregando aquilo que Ele permitiu, para honra e glória dEle!",
    church: "Comunidade Apostólica Livre - CAL",
    city: "Praia Grande - SP",
    role: "Servo de Deus",
  },
};

const mockAdjacentPrev = {
  title: "A importância de orar de madrugada",
  slug: "oracao-da-madrugada",
};

const mockAdjacentNext = {
  title: "Como manter a constância na leitura bíblica",
  slug: "constancia-leitura-biblica",
};

const mockRelatedArticle = {
  id: "article-2",
  title: "A importância de discernir os tempos",
  slug: "discernir-os-tempos",
  meta_description: "Entenda os sinais e a sabedoria necessária.",
};

let currentArticleData: any = mockArticle;
let fetchShouldFail = false;

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "articles") {
        return {
          select: vi.fn((fields: string) => ({
            eq: vi.fn((column: string, val: any) => {
              if (column === "slug") {
                return {
                  single: vi.fn(() =>
                    Promise.resolve(
                      fetchShouldFail
                        ? { data: null, error: new Error("Not found") }
                        : { data: currentArticleData, error: null }
                    )
                  ),
                };
              }
              // For adjacent and related queries
              return {
                lt: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(() =>
                        Promise.resolve({ data: mockAdjacentPrev, error: null })
                      ),
                    })),
                  })),
                })),
                gt: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(() =>
                        Promise.resolve({ data: mockAdjacentNext, error: null })
                      ),
                    })),
                  })),
                })),
                neq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(() =>
                        Promise.resolve({ data: mockRelatedArticle, error: null })
                      ),
                    })),
                  })),
                })),
              };
            }),
          })),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
      };
    }),
  },
}));

const renderArtigoPage = (slug = "cuidado-com-falsos-profetas") => {
  return render(
    <MemoryRouter initialEntries={[`/artigos/${slug}`]}>
      <TooltipProvider>
        <Routes>
          <Route path="/artigos/:slug" element={<ArtigoPage />} />
        </Routes>
      </TooltipProvider>
    </MemoryRouter>
  );
};

describe("ArtigoPage Redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentArticleData = mockArticle;
    fetchShouldFail = false;
  });

  it("renderiza o Hero Banner imersivo com overline DEVOCIONAL, título e lead em itálico", async () => {
    renderArtigoPage();

    await waitFor(() => {
      expect(screen.getByTestId("article-hero-banner")).toBeInTheDocument();
    });

    const hero = within(screen.getByTestId("article-hero-banner"));
    expect(hero.getByText("DEVOCIONAL")).toBeInTheDocument();
    expect(
      hero.getByRole("heading", {
        name: "Não corra atrás de profetas: busque a Deus e cuidado com os falsos profetas",
      })
    ).toBeInTheDocument();
    expect(
      hero.getByText(
        "A Bíblia nos ensina a discernir entre a verdadeira voz de Deus e as vozes enganosas que se levantam no meio de nós."
      )
    ).toBeInTheDocument();
  });

  it("renderiza a Faixa de Metadados com data, categoria, tempo de leitura e botão de compartilhar", async () => {
    renderArtigoPage();

    await waitFor(() => {
      expect(screen.getByTestId("article-meta-bar")).toBeInTheDocument();
    });

    const metaBar = within(screen.getByTestId("article-meta-bar"));
    expect(metaBar.getByText(/setembro de 2026/i)).toBeInTheDocument();
    expect(metaBar.getByText("Devocional")).toBeInTheDocument();
    expect(metaBar.getByText(/min de leitura/i)).toBeInTheDocument();
    expect(metaBar.getByRole("button", { name: /compartilhar/i })).toBeInTheDocument();
  });

  it("renderiza o corpo do artigo com títulos e citações estilizadas e assinatura Bíblia Vive", async () => {
    renderArtigoPage();

    await waitFor(() => {
      expect(screen.getByTestId("article-markdown-body")).toBeInTheDocument();
    });

    const body = within(screen.getByTestId("article-markdown-body"));
    expect(body.getByText("O que a Bíblia nos ensina")).toBeInTheDocument();
    expect(body.getByText("Busque a Deus, não os homens")).toBeInTheDocument();
    expect(body.getByText(/O Senhor é a minha força e o meu escudo/i)).toBeInTheDocument();

    // Assinatura editorial
    expect(screen.getByTestId("article-editorial-signature")).toBeInTheDocument();
    expect(
      screen.getByText("Mais que uma leitura, um encontro com Deus.")
    ).toBeInTheDocument();
  });

  it("renderiza a Sidebar com os 3 cards dedicados: Sobre o Autor, Leituras Relacionadas e Citação", async () => {
    renderArtigoPage();

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-card-author")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-card-related")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-card-quote")).toBeInTheDocument();
    });

    // Card 1: Autor
    const authorCard = within(screen.getByTestId("sidebar-card-author"));
    expect(authorCard.getByText("SOBRE O AUTOR")).toBeInTheDocument();
    expect(authorCard.getByRole("link", { name: "Bruno Malossi" })).toBeInTheDocument();
    expect(authorCard.getByText("Servo de Deus")).toBeInTheDocument();
    expect(authorCard.getByText("Comunidade Apostólica Livre - CAL")).toBeInTheDocument();
    expect(authorCard.getByText("Praia Grande - SP")).toBeInTheDocument();

    // Card 2: Leituras Relacionadas
    const relatedCard = within(screen.getByTestId("sidebar-card-related"));
    expect(relatedCard.getByText("LEITURAS RELACIONADAS")).toBeInTheDocument();
    expect(relatedCard.getByText("DEVOCIONAL")).toBeInTheDocument();
    expect(relatedCard.getByText("HARPA CRISTÃ")).toBeInTheDocument();
    expect(relatedCard.getByText("Confiar em Deus")).toBeInTheDocument();
    expect(relatedCard.getByText("PLANO DE LEITURA")).toBeInTheDocument();
    expect(relatedCard.getByText("Os Evangelhos em 30 dias")).toBeInTheDocument();

    // Card 3: Citação em Destaque
    const quoteCard = within(screen.getByTestId("sidebar-card-quote"));
    expect(quoteCard.getByText(/O Senhor é a minha força/i)).toBeInTheDocument();
    expect(quoteCard.getByText(/Salmo 28:7/i)).toBeInTheDocument();
  });

  it("renderiza os botões de navegação anterior, voltar para a lista e próximo", async () => {
    renderArtigoPage();

    await waitFor(() => {
      expect(screen.getByTestId("article-navigation-footer")).toBeInTheDocument();
    });

    const footer = within(screen.getByTestId("article-navigation-footer"));
    expect(footer.getByRole("link", { name: /artigo anterior/i })).toHaveAttribute(
      "href",
      "/artigos/oracao-da-madrugada"
    );
    expect(footer.getByRole("link", { name: /voltar para a lista/i })).toHaveAttribute(
      "href",
      "/artigos"
    );
    expect(footer.getByRole("link", { name: /próximo artigo/i })).toHaveAttribute(
      "href",
      "/artigos/constancia-leitura-biblica"
    );
  });

  it("exibe estado amigável quando o artigo não for encontrado", async () => {
    fetchShouldFail = true;
    renderArtigoPage("artigo-inexistente");

    await waitFor(() => {
      expect(screen.getByText("Artigo não encontrado")).toBeInTheDocument();
    });

    expect(
      screen.getByText("O artigo que você procura não existe ou foi removido.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver todos os artigos/i })).toHaveAttribute(
      "href",
      "/artigos"
    );
  });
});
