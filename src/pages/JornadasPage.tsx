import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useEditorialJornadas } from "@/hooks/useEditorialJornadas";
import { useEditorialChapter } from "@/hooks/useEditorialChapter";
import {
  EditorialChapter,
  getEditorialChapterLink,
  getEditorialChapterReferenceText,
} from "@/types/editorialChapter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Sprout,
  Eye,
  Ear,
  Mountain,
  Moon,
  Home,
  BookOpen,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────────────────────
// Estrutura Canônica das 7 Séries da Bíblia Vive (Conforme Design Oficial)
// ─────────────────────────────────────────────────────────────────────────────
interface CanonicalSeriesDefinition {
  id: string;
  name: string;
  order: number;
  icon: LucideIcon;
  summary: string;
  fallbackChapters: {
    chapter_number: number;
    title: string;
    book_name: string;
    book_slug: string;
    chapter: number;
    verse_start?: number;
    verse_end?: number;
    intro_text: string;
  }[];
}

const CANONICAL_SERIES: CanonicalSeriesDefinition[] = [
  {
    id: "permanecer",
    name: "Permanecer",
    order: 1,
    icon: Sprout,
    summary: "Voltar à Palavra. Criar espaço. Permanecer.",
    fallbackChapters: [
      {
        chapter_number: 1,
        title: "O primeiro passo é parar",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 46,
        verse_start: 10,
        intro_text:
          "No ritmo frenético do cotidiano, o convite das Escrituras começa com uma pausa deliberada. Aquietar o coração é a porta de entrada para a presença divina.",
      },
      {
        chapter_number: 2,
        title: "Criar espaço no dia",
        book_name: "Marcos",
        book_slug: "marcos",
        chapter: 1,
        verse_start: 35,
        intro_text:
          "Antes de qualquer demanda, Jesus buscava a quietude da manhã. O espaço para Deus não sobra: ele é cuidadosamente guardado e cultivado.",
      },
      {
        chapter_number: 3,
        title: "A Palavra como alimento diário",
        book_name: "Mateus",
        book_slug: "mateus",
        chapter: 4,
        verse_start: 4,
        intro_text:
          "Não só de pão viverá o homem. A Palavra nutre o íntimo onde nenhuma outra voz tem alcance, reordenando prioridades e pensamentos.",
      },
      {
        chapter_number: 4,
        title: "Permanecer no silêncio",
        book_name: "Lamentações",
        book_slug: "lamentacoes",
        chapter: 3,
        verse_start: 25,
        verse_end: 26,
        intro_text:
          "Bom é esperar tranquilo pela salvação do Senhor. O silêncio não é ausência, mas a escuta atenta de quem confia no tempo divino.",
      },
      {
        chapter_number: 5,
        title: "A raiz que não seca",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 1,
        verse_start: 1,
        verse_end: 3,
        intro_text:
          "Como árvore plantada junto a ribeiros de águas, quem medita na lei do Senhor frutifica na estação própria e sua folhagem não murcha.",
      },
      {
        chapter_number: 6,
        title: "Continue: a constância da caminhada",
        book_name: "Hebreus",
        book_slug: "hebreus",
        chapter: 12,
        verse_start: 1,
        verse_end: 2,
        intro_text:
          "Corramos com perseverança a corrida que nos foi proposta, fitando os olhos em Jesus, o autor e consumador de nossa fé.",
      },
    ],
  },
  {
    id: "cultivo",
    name: "Cultivo",
    order: 2,
    icon: Sprout,
    summary: "O que permanece começa a criar raízes.",
    fallbackChapters: [
      {
        chapter_number: 1,
        title: "A semente lançada na terra",
        book_name: "Marcos",
        book_slug: "marcos",
        chapter: 4,
        verse_start: 26,
        verse_end: 29,
        intro_text:
          "A semente germina e cresce sem que o agricultor saiba exatamente como. Há uma obra invisível e soberana acontecendo no solo da alma.",
      },
      {
        chapter_number: 2,
        title: "O solo do coração",
        book_name: "Lucas",
        book_slug: "lucas",
        chapter: 8,
        verse_start: 15,
        intro_text:
          "As sementes em terra boa são os que, ouvindo a Palavra com coração nobre e generoso, a retêm e com perseverança produzem fruto.",
      },
      {
        chapter_number: 3,
        title: "Paciência na espera",
        book_name: "Tiago",
        book_slug: "tiago",
        chapter: 5,
        verse_start: 7,
        verse_end: 8,
        intro_text:
          "O lavrador espera o precioso fruto da terra, aguardando com paciência até que receba as primeiras e as últimas chuvas.",
      },
      {
        chapter_number: 4,
        title: "Podar para florescer",
        book_name: "João",
        book_slug: "joao",
        chapter: 15,
        verse_start: 1,
        verse_end: 2,
        intro_text:
          "Todo ramo que dá fruto, Ele o limpa para que produza ainda mais. O cuidado do Agricultor celestial às vezes corta para expandir a vida.",
      },
      {
        chapter_number: 5,
        title: "Frutos no tempo certo",
        book_name: "Gálatas",
        book_slug: "galatas",
        chapter: 5,
        verse_start: 22,
        verse_end: 23,
        intro_text:
          "Amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão e domínio próprio. O fruto do Espírito brota do cultivo diário.",
      },
      {
        chapter_number: 6,
        title: "Cultivar é continuar",
        book_name: "Colossenses",
        book_slug: "colossenses",
        chapter: 2,
        verse_start: 6,
        verse_end: 7,
        intro_text:
          "Assim como vocês receberam a Cristo Jesus, o Senhor, continuem a viver nele, enraizados e edificados sobre ele, firmados na fé.",
      },
    ],
  },
  {
    id: "discernimento",
    name: "Discernimento",
    order: 3,
    icon: Eye,
    summary: "A Palavra começa a transformar o modo de olhar.",
    fallbackChapters: [
      {
        chapter_number: 1,
        title: "Olhos para enxergar",
        book_name: "Efésios",
        book_slug: "efesios",
        chapter: 1,
        verse_start: 18,
        intro_text:
          "Iluminados os olhos do vosso coração, para que saibais qual é a esperança da sua vocação e a suprema riqueza de sua glória.",
      },
      {
        chapter_number: 2,
        title: "A lâmpada para os pés",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 119,
        verse_start: 105,
        intro_text:
          "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho. Ela não ilumina todo o horizonte distante de uma vez, mas clareia o próximo passo.",
      },
      {
        chapter_number: 3,
        title: "Além das aparências",
        book_name: "1 Samuel",
        book_slug: "1samuel",
        chapter: 16,
        verse_start: 7,
        intro_text:
          "O Senhor não vê como o homem vê; o homem vê a aparência exterior, mas o Senhor olha para o coração.",
      },
      {
        chapter_number: 4,
        title: "A renovação da mente",
        book_name: "Romanos",
        book_slug: "romanos",
        chapter: 12,
        verse_start: 2,
        intro_text:
          "Não vos conformeis com este século, mas transformai-vos pela renovação da vossa mente, para que experimenteis a boa, agradável e perfeita vontade de Deus.",
      },
      {
        chapter_number: 5,
        title: "Separar o essencial do vão",
        book_name: "Filipenses",
        book_slug: "filipenses",
        chapter: 1,
        verse_start: 9,
        verse_end: 10,
        intro_text:
          "Para que o vosso amor aumente cada vez mais em pleno conhecimento e toda a percepção, para que aproveis as coisas excelentes.",
      },
      {
        chapter_number: 6,
        title: "O olhar que retorna à fonte",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 1,
        verse_start: 2,
        intro_text:
          "O discernimento maduro sabe onde encontrar repouso e sabedoria. Seu prazer supremo está na lei do Senhor, e nela medita dia e noite.",
      },
    ],
  },
  {
    id: "escuta",
    name: "Escuta",
    order: 4,
    icon: Ear,
    summary: "Quando a Palavra deixa de ser apenas lida e passa a nos interpelar.",
    fallbackChapters: [
      {
        chapter_number: 1,
        title: "A Palavra não é genérica",
        book_name: "Romanos",
        book_slug: "romanos",
        chapter: 15,
        verse_start: 4,
        intro_text:
          "A Palavra alcança a vida concreta e nos tira da posição de espectadores. Aquilo que foi escrito no passado permanece vivo para nos dar esperança e ânimo hoje.",
      },
      {
        chapter_number: 2,
        title: "Fala, Senhor, teu servo ouve",
        book_name: "1 Samuel",
        book_slug: "1samuel",
        chapter: 3,
        verse_start: 9,
        verse_end: 10,
        intro_text:
          "A postura de escuta é a renúncia da autossuficiência. Abrir o coração para a voz de Deus exige disponibilidade e mansidão.",
      },
      {
        chapter_number: 3,
        title: "A voz suave e mansa",
        book_name: "1 Reis",
        book_slug: "1reis",
        chapter: 19,
        verse_start: 11,
        verse_end: 12,
        intro_text:
          "Não no vento forte que despedaçava penhascos, nem no terremoto ou no fogo. O Senhor falou a Elias em um cicio suave e delicado.",
      },
      {
        chapter_number: 4,
        title: "Ouvir e praticar",
        book_name: "Tiago",
        book_slug: "tiago",
        chapter: 1,
        verse_start: 22,
        intro_text:
          "Sejam praticantes da palavra, e não apenas ouvintes, enganando a si mesmos. Quem ouve e não pratica assemelha-se a quem contempla seu rosto no espelho e logo se esquece.",
      },
      {
        chapter_number: 5,
        title: "Corações atentos",
        book_name: "Provérbios",
        book_slug: "proverbios",
        chapter: 4,
        verse_start: 20,
        verse_end: 22,
        intro_text:
          "Filho meu, atenta para as minhas palavras; aos meus ensinamentos inclina os ouvidos. São vida para os que as acham e saúde para o seu corpo.",
      },
      {
        chapter_number: 6,
        title: "A Palavra viva e eficaz",
        book_name: "Hebreus",
        book_slug: "hebreus",
        chapter: 4,
        verse_start: 12,
        intro_text:
          "Porque a palavra de Deus é viva, e eficaz, e mais cortante do que qualquer espada de dois gumes, apta para discernir os pensamentos e propósitos do coração.",
      },
    ],
  },
  {
    id: "formacao",
    name: "Formação",
    order: 5,
    icon: Mountain,
    summary: "O que foi percebido e acolhido começa a moldar o caráter.",
    fallbackChapters: [
      {
        chapter_number: 1,
        title: "O barro nas mãos do oleiro",
        book_name: "Jeremias",
        book_slug: "jeremias",
        chapter: 18,
        verse_start: 6,
        intro_text:
          "Como o barro na mão do oleiro, assim sois vós na minha mão. Permitir que Deus nos molde é o caminho mais seguro para a verdadeira maturidade.",
      },
      {
        chapter_number: 2,
        title: "Moldados à Sua imagem",
        book_name: "2 Coríntios",
        book_slug: "2corintios",
        chapter: 3,
        verse_start: 18,
        intro_text:
          "E todos nós, com o rosto desvendado, contemplando como por espelho a glória do Senhor, somos transformados de glória em glória na mesma imagem.",
      },
      {
        chapter_number: 3,
        title: "A forja da perseverança",
        book_name: "Romanos",
        book_slug: "romanos",
        chapter: 5,
        verse_start: 3,
        verse_end: 5,
        intro_text:
          "A tribulação produz perseverança; a perseverança, um caráter aprovado; e o caráter aprovado, esperança. E a esperança não nos decepciona.",
      },
      {
        chapter_number: 4,
        title: "Revestidos de humildade",
        book_name: "Colossenses",
        book_slug: "colossenses",
        chapter: 3,
        verse_start: 12,
        intro_text:
          "Como eleitos de Deus, santos e amados, revistam-se de profunda compaixão, de bondade, de humildade, de mansidão e de paciência.",
      },
      {
        chapter_number: 5,
        title: "A mansidão que sustenta",
        book_name: "Mateus",
        book_slug: "mateus",
        chapter: 11,
        verse_start: 29,
        intro_text:
          "Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração; e achareis descanso para as vossas almas.",
      },
      {
        chapter_number: 6,
        title: "A maturidade da fé",
        book_name: "Efésios",
        book_slug: "efesios",
        chapter: 4,
        verse_start: 13,
        verse_end: 15,
        intro_text:
          "Até que todos cheguemos à unidade da fé e do pleno conhecimento do Filho de Deus, ao estado de homem perfeito, à medida da estatura da plenitude de Cristo.",
      },
    ],
  },
  {
    id: "descanso",
    name: "Descanso",
    order: 6,
    icon: Moon,
    summary: "A Palavra sustenta quando as forças se esgotam.",
    fallbackChapters: [
      {
        chapter_number: 1,
        title: "Vinde a Mim os cansados",
        book_name: "Mateus",
        book_slug: "mateus",
        chapter: 11,
        verse_start: 28,
        intro_text:
          "Venham a mim, todos os que estão cansados e sobrecarregados, e eu vos darei descanso. A graça oferece abrigo para as fadigas da jornada humana.",
      },
      {
        chapter_number: 2,
        title: "O sábado da alma",
        book_name: "Hebreus",
        book_slug: "hebreus",
        chapter: 4,
        verse_start: 9,
        verse_end: 10,
        intro_text:
          "Resta ainda um repouso sabático para o povo de Deus. Aquele que entrou no descanso de Deus, também ele descansou de suas obras.",
      },
      {
        chapter_number: 3,
        title: "Deitar e dormir em paz",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 4,
        verse_start: 8,
        intro_text:
          "Em paz também me deitarei e dormirei, porque só tu, Senhor, me fazes habitar em segurança. O descanso seguro nasce da certeza do cuidado divino.",
      },
      {
        chapter_number: 4,
        title: "Sob a sombra do Onipotente",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 91,
        verse_start: 1,
        verse_end: 2,
        intro_text:
          "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Direi do Senhor: Ele é o meu refúgio e a minha fortaleza.",
      },
      {
        chapter_number: 5,
        title: "Aquietai-vos e sabei",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 46,
        verse_start: 10,
        intro_text:
          "Aquietai-vos e sabei que eu sou Deus; sou exaltado entre as nações, sou exaltado na terra. Deixar de lutar com as próprias mãos é o início do repouso.",
      },
      {
        chapter_number: 6,
        title: "Renovados como a águia",
        book_name: "Isaías",
        book_slug: "isaias",
        chapter: 40,
        verse_start: 31,
        intro_text:
          "Os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.",
      },
    ],
  },
  {
    id: "habitacao",
    name: "Habitação",
    order: 7,
    icon: Home,
    summary: "A Palavra acompanha a vida em todos os lugares.",
    fallbackChapters: [
      {
        chapter_number: 1,
        title: "Fazer morada na Palavra",
        book_name: "João",
        book_slug: "joao",
        chapter: 14,
        verse_start: 23,
        intro_text:
          "Se alguém me ama, guardará a minha palavra, e meu Pai o amará, e viremos para ele e faremos nele morada. O lar supremo é habitar no amor de Deus.",
      },
      {
        chapter_number: 2,
        title: "Nas portas e nos caminhos",
        book_name: "Deuteronômio",
        book_slug: "deuteronomio",
        chapter: 6,
        verse_start: 6,
        verse_end: 9,
        intro_text:
          "Estas palavras que hoje te ordeno estarão no teu coração; e as ensinarás a teus filhos e delas falarás sentado em tua casa e andando pelo caminho.",
      },
      {
        chapter_number: 3,
        title: "A tenda do encontro diário",
        book_name: "Êxodo",
        book_slug: "exodo",
        chapter: 33,
        verse_start: 7,
        intro_text:
          "Moisés costumava armar a tenda fora do arraial e a chamava de tenda da congregação; qualquer um que buscava ao Senhor saía até ela.",
      },
      {
        chapter_number: 4,
        title: "Em todo tempo bendirei",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 34,
        verse_start: 1,
        intro_text:
          "Bendirei o Senhor em todo o tempo; o seu louvor estará continuamente na minha boca. A Palavra não é confinada a rituais, mas permeia todo instante.",
      },
      {
        chapter_number: 5,
        title: "Sal e luz onde estiver",
        book_name: "Mateus",
        book_slug: "mateus",
        chapter: 5,
        verse_start: 13,
        verse_end: 16,
        intro_text:
          "Vós sois o sal da terra e a luz do mundo. Uma cidade edificada sobre um monte não se pode esconder. A habitação da Palavra irradia para todos ao redor.",
      },
      {
        chapter_number: 6,
        title: "Habitar na casa do Senhor",
        book_name: "Salmos",
        book_slug: "salmos",
        chapter: 23,
        verse_start: 6,
        intro_text:
          "Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na Casa do Senhor por longos dias.",
      },
    ],
  },
];

export default function JornadasPage() {
  usePageMeta({
    title: "Sua caminhada — Leituras Contemplativas | Bíblia Vive",
    description:
      "Explore a biblioteca de capítulos da sua caminhada de Permanência. Leituras contemplativas organizadas por séries.",
    canonical: "/jornadas",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Sua caminhada — Leituras Contemplativas",
        url: `${window.location.origin}/jornadas`,
        description:
          "Explore a biblioteca de capítulos da sua caminhada de Permanência. Leituras contemplativas organizadas por séries.",
        isPartOf: {
          "@type": "WebSite",
          name: "Bíblia Vive",
          url: window.location.origin,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: window.location.origin },
          { "@type": "ListItem", position: 2, name: "Sua caminhada", item: `${window.location.origin}/jornadas` },
        ],
      },
    ],
  });

  const { seriesGroups, loading: loadingGroups } = useEditorialJornadas();
  const { chapter: todayChapter } = useEditorialChapter();

  // Estados de modais
  const [selectedSeries, setSelectedSeries] = useState<CanonicalSeriesDefinition | null>(null);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [selectedChapterForReading, setSelectedChapterForReading] = useState<{
    title: string;
    seriesName: string;
    chapterNumber: number;
    referenceText: string;
    introText: string;
    targetLink: string;
  } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Dados do Card Principal (Hero) com fallback idêntico à imagem de referência
  const heroSeriesName = todayChapter?.series_name ? todayChapter.series_name.toUpperCase() : "ESCUTA";
  const heroTitle = todayChapter?.title || "A Palavra não é genérica";
  const heroReferenceText = todayChapter
    ? getEditorialChapterReferenceText(todayChapter)
    : "Romanos 15:4";
  const heroTargetLink = todayChapter
    ? getEditorialChapterLink(todayChapter)
    : "/nvi/romanos/15#v4";

  const heroIntroText =
    todayChapter?.intro_text ||
    `A Palavra alcança a vida concreta e nos tira da posição de espectadores.

Você não abre as Escrituras como quem observa uma história que aconteceu apenas com outras pessoas. Aquilo que foi escrito permanece diante de você.

As narrativas bíblicas não são relíquias protegidas por vitrines antigas nem ideias abstratas sobre o passado. Quando Deus fala através das Escrituras, Ele se dirige ao presente, tocando a vida de quem escuta com atenção.

Permanecer diante do texto é permitir que a esperança seja renovada e que a verdade divina encontre morada viva em seu coração hoje.`;

  const heroParagraphs = heroIntroText.split("\n\n").filter(Boolean);
  const rawFirstParagraph =
    heroParagraphs[0] || "A Palavra alcança a vida concreta e nos tira da posição de espectadores.";

  // Delimitação estrita a no máximo 2 linhas (~18-20 palavras) para manter o card com altura elegante
  const heroExcerpt = useMemo(() => {
    const clean = rawFirstParagraph.replace(/\s+/g, " ").trim();
    const words = clean.split(" ");
    if (words.length <= 20) return clean;
    return words.slice(0, 20).join(" ").replace(/[,.;:—-]+$/, "") + "...";
  }, [rawFirstParagraph]);

  // Mapeamento dinâmico entre o catálogo canônico e os dados do banco Supabase
  const renderedSeries = useMemo(() => {
    return CANONICAL_SERIES.map((canonical) => {
      // Procura correspondente no Supabase por nome de série
      const dbGroup = seriesGroups.find(
        (g) => g.seriesName.trim().toLowerCase() === canonical.name.trim().toLowerCase()
      );

      // Se houver capítulos cadastrados no banco, usamos os do banco
      const chapters =
        dbGroup && dbGroup.chapters.length > 0
          ? dbGroup.chapters.map((ch) => ({
              chapter_number: ch.chapter_number,
              title: ch.title,
              book_name: ch.book_name,
              book_slug: ch.book_slug,
              chapter: ch.chapter,
              verse_start: ch.verse_start ?? undefined,
              verse_end: ch.verse_end ?? undefined,
              intro_text: ch.intro_text,
            }))
          : canonical.fallbackChapters;

      return {
        ...canonical,
        chapters,
      };
    });
  }, [seriesGroups]);

  // Deep link (?capitulo=ID)
  useEffect(() => {
    if (loadingGroups) return;
    const capituloId = searchParams.get("capitulo");
    if (!capituloId) return;

    // Busca no Supabase
    const allDbChapters = seriesGroups.flatMap((g) => g.chapters);
    const found = allDbChapters.find((c) => c.id === capituloId);
    if (found) {
      setSelectedChapterForReading({
        title: found.title,
        seriesName: found.series_name,
        chapterNumber: found.chapter_number,
        referenceText: getEditorialChapterReferenceText(found),
        introText: found.intro_text,
        targetLink: getEditorialChapterLink(found),
      });
      setSearchParams({}, { replace: true });
    }
  }, [loadingGroups, seriesGroups, searchParams, setSearchParams]);

  return (
    <Layout maxWidthClassName="max-w-6xl">
      <div className="w-full pb-16 pt-2 md:pt-4">
        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 1. CABEÇALHO CENTRAL                                              */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <header className="mb-10 sm:mb-12 text-center">
          <p className="font-mono text-[0.65rem] sm:text-xs uppercase tracking-[0.22em] text-[#e5b869] font-medium mb-3">
            CAPÍTULOS PARA A CAMINHADA
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-[2.35rem] font-normal tracking-tight text-[#f4efea] leading-[1.3] max-w-2xl mx-auto">
            Pequenos encontros com a Palavra,
            <br className="hidden sm:inline" /> um capítulo de cada vez.
          </h1>
        </header>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 2. CARD PRINCIPAL (HERO) — CAPÍTULO DE HOJE                       */}
        {/* Efeito de transição degradê "fumaça" impecável                    */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <section aria-label="Capítulo de hoje" className="mb-10 sm:mb-12">
          <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#382f23]/80 bg-[#161412] shadow-2xl transition-all duration-300 hover:border-[#c69a50]/60">
            {/* Imagem de Fundo com Máscara e Degradês em Camadas para o Efeito Fumaça */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-[58%] md:w-[48%] lg:w-[44%] overflow-hidden select-none">
              <img
                src="/images/jornadas-mountain-hero.jpg"
                alt="Montanhas ao amanhecer com raios de sol e névoa"
                className="h-full w-full object-cover object-left"
                style={{
                  maskImage:
                    "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.25) 78%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.25) 78%, transparent 100%)",
                }}
              />

              {/* Camada 1 de Efeito Fumaça: Gradiente Linear Horizontal Suave */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#161412]/40 via-40% to-[#161412]" />

              {/* Camada 2 de Efeito Fumaça: Névoa Radial Difusa / Densidade de Fumaça */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_90%_at_75%_50%,#161412_15%,rgba(22,20,18,0.75)_50%,transparent_90%)]" />

              {/* Camada 3: Blush/Brilho Dourado Confortável e Suave */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_45%,rgba(229,184,105,0.12)_0%,rgba(198,154,80,0.03)_50%,transparent_80%)] mix-blend-screen" />

              {/* Camada 4: Vinhetas Suaves de Borda (Top/Bottom/Left) */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#161412]/50 via-transparent to-[#161412]/70" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#161412]/30 via-transparent to-transparent" />
            </div>

            {/* Arcos Concêntricos Dourados Decorativos (Lado Direito) */}
            <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 h-[150%] w-1/2 max-w-[360px] select-none overflow-hidden flex items-center justify-end">
              <svg
                className="h-full w-full opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                viewBox="0 0 360 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="340" cy="140" r="90" stroke="#e5b869" strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="340" cy="140" r="140" stroke="#e5b869" strokeWidth="1" strokeOpacity="0.25" />
                <circle cx="340" cy="140" r="190" stroke="#e5b869" strokeWidth="1" strokeOpacity="0.18" />
                <circle cx="340" cy="140" r="240" stroke="#e5b869" strokeWidth="1" strokeOpacity="0.1" />
              </svg>
            </div>

            {/* Conteúdo do Card Principal */}
            <div className="relative z-10 p-5 sm:p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Informações Centrais / Lado Esquerdo */}
              <div className="max-w-xl pl-0 sm:pl-2">
                {/* Pílula de Categoria */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#c69a50]/50 bg-[#221c16]/80 text-[#e5b869] font-mono text-[0.62rem] sm:text-[0.68rem] tracking-[0.18em] uppercase mb-2.5">
                  <span>CAPÍTULO DE HOJE &bull; {heroSeriesName}</span>
                </div>

                {/* Título do Capítulo */}
                <h2
                  onClick={() => setIsHeroModalOpen(true)}
                  className="font-serif text-xl sm:text-2xl md:text-[1.7rem] text-[#f4efea] font-normal leading-tight tracking-normal mb-2 cursor-pointer hover:text-[#e5b869] transition-colors"
                >
                  {heroTitle}
                </h2>

                {/* Referência Bíblica */}
                <div className="flex items-center gap-2 text-xs text-[#d5c7b5] mb-2 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-[#e5b869]" />
                  <span>{heroReferenceText}</span>
                </div>

                {/* Texto Introdutório / Resumo delimitado a no máximo 2 linhas */}
                <p className="font-sans text-xs sm:text-[0.82rem] text-[#9b8e7e] leading-relaxed max-w-lg line-clamp-2">
                  {heroExcerpt}
                </p>

                {/* Link Discreto para Ler a Reflexão Completa */}
                <button
                  type="button"
                  onClick={() => setIsHeroModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-[0.7rem] text-[#e5b869]/90 hover:text-[#e5b869] font-medium transition-colors cursor-pointer"
                >
                  Ler reflexão completa &rarr;
                </button>
              </div>

              {/* Lado Direito: Linha Divisória e Botão de Ação */}
              <div className="flex items-center gap-6 sm:gap-8 shrink-0 self-start md:self-center pr-0 lg:pr-8">
                {/* Hairline Divisória Vertical */}
                <div className="hidden md:block h-20 w-[1px] bg-white/[0.08]" />

                <Link
                  to={heroTargetLink}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#e5b869] hover:bg-[#d8a855] text-[#161412] text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Ler capítulo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 3. SEÇÃO "SUA CAMINHADA"                                          */}
        {/* Grade de 4 colunas com as 7 séries. SEM BARRAS LATERAIS ESQUERDAS! */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <section aria-label="Sua caminhada" className="w-full">
          {/* Cabeçalho da Seção */}
          <div className="mb-6">
            <p className="font-mono text-[0.65rem] sm:text-xs uppercase tracking-[0.22em] text-[#e5b869] font-medium mb-1.5">
              SUA CAMINHADA
            </p>
            <p className="text-xs sm:text-sm text-[#9b8e7e]">
              Cada série é um passo na mesma direção: mais perto da Palavra.
            </p>
          </div>

          {/* Grade Responsiva em 4 Colunas (Top: 4 cards, Bottom: 3 cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {renderedSeries.map((series) => {
              const IconComponent = series.icon;
              return (
                <div
                  key={series.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSeries(series)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSeries(series);
                    }
                  }}
                  aria-label={`Ver capítulos da série ${series.name}`}
                  /* ATENÇÃO: NÃO ADICIONAR BARRAS LATERAIS ESQUERDAS (REQUISITO EXPLÍCITO DO USUÁRIO) */
                  className="group relative overflow-hidden rounded-xl border border-[#382f23]/80 bg-[#161412] p-5 shadow-lg transition-all duration-300 hover:border-[#c69a50]/60 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e5b869]/50 select-none min-h-[160px]"
                >
                  {/* Fundo Atmosférico com Névoa Sutil */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-[url('/images/jornadas-mountain-hero.jpg')] bg-cover bg-center opacity-[0.06] mix-blend-luminosity group-hover:opacity-[0.11] transition-opacity duration-500"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1c1814]/80 via-[#161412] to-[#12100e]"
                    aria-hidden="true"
                  />

                  {/* Conteúdo do Card */}
                  <div className="relative z-10">
                    {/* Linha Superior: Ícone de Domínio Dourado + Nome da Série */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <IconComponent
                        className="w-5 h-5 text-[#e5b869] shrink-0 stroke-[1.5] group-hover:scale-110 transition-transform duration-200"
                        aria-hidden="true"
                      />
                      <h2 className="font-serif text-base sm:text-lg text-[#f0e8de] font-normal tracking-wide group-hover:text-[#e5b869] transition-colors">
                        {series.name}
                      </h2>
                    </div>

                    {/* Resumo da Série */}
                    <p className="font-sans text-xs text-[#8f8272] leading-relaxed line-clamp-2 min-h-[34px]">
                      {series.summary}
                    </p>
                  </div>

                  {/* Rodapé do Card: Contador de Capítulos + Seta Indicadora */}
                  <div className="relative z-10 pt-4 border-t border-[#382f23]/50 flex items-center justify-between mt-3 text-xs text-[#c69a50]">
                    <div className="flex items-center gap-1.5 font-mono text-[0.72rem] text-[#c69a50]">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{series.chapters.length} capítulos</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#c69a50] transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* MODAL 1: LEITURA COMPLETA DA REFLEXÃO DO CAPÍTULO DE HOJE         */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <Dialog open={isHeroModalOpen} onOpenChange={setIsHeroModalOpen}>
          <DialogContent className="max-w-xl sm:max-w-2xl border-[#382f23] bg-[#161412] text-[#f5f5f0] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            <DialogHeader className="space-y-2 text-left border-b border-[#382f23]/60 pb-4 shrink-0">
              <span className="font-mono text-[0.62rem] sm:text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-[#e5b869]">
                CAPÍTULO DE HOJE &bull; {heroSeriesName}
              </span>

              <DialogTitle className="font-serif text-xl sm:text-2xl md:text-[1.65rem] font-normal text-[#f5f5f0] leading-snug">
                {heroTitle}
              </DialogTitle>

              <DialogDescription className="sr-only">
                Texto completo da reflexão do capítulo de hoje sobre {heroReferenceText}
              </DialogDescription>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700/60 bg-neutral-900/60 px-3 py-1 text-[0.72rem] text-neutral-300 w-fit mt-1">
                <BookOpen className="h-3.5 w-3.5 text-[#e5b869]" />
                <span className="font-sans font-medium tracking-wide">{heroReferenceText}</span>
              </div>
            </DialogHeader>

            {/* Conteúdo com os Parágrafos Completos da Reflexão */}
            <div className="my-5 overflow-y-auto pr-2 space-y-4 font-serif text-sm sm:text-base text-neutral-200/90 leading-relaxed custom-scrollbar flex-1">
              {heroParagraphs.map((para, index) => (
                <p key={index} className="text-balance font-light leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Rodapé com CTA para Leitura Bíblica e Fechar */}
            <div className="pt-4 border-t border-[#382f23]/60 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsHeroModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#382f23] text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Fechar
              </button>

              <Link
                to={heroTargetLink}
                onClick={() => setIsHeroModalOpen(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#e5b869] px-6 py-2.5 text-xs font-semibold text-[#121110] shadow-md hover:bg-[#d8a855] transition-all cursor-pointer"
              >
                <span>Ler capítulo na Bíblia ({heroReferenceText})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </DialogContent>
        </Dialog>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* MODAL 2: EXPLORAÇÃO DOS 6 CAPÍTULOS DE UMA SÉRIE                  */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <Dialog open={!!selectedSeries} onOpenChange={(open) => !open && setSelectedSeries(null)}>
          <DialogContent className="max-w-2xl sm:max-w-3xl border-[#382f23] bg-[#161412] text-[#f5f5f0] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            {selectedSeries && (
              <>
                <DialogHeader className="space-y-2 text-left border-b border-[#382f23]/60 pb-4 shrink-0">
                  <div className="flex items-center gap-2 text-[#e5b869]">
                    <selectedSeries.icon className="w-4 h-4 stroke-[1.5]" />
                    <span className="font-mono text-xs uppercase tracking-[0.2em] font-medium">
                      Série {selectedSeries.order} · {selectedSeries.name}
                    </span>
                  </div>

                  <DialogTitle className="font-serif text-xl sm:text-2xl font-normal text-[#f5f5f0]">
                    {selectedSeries.name}
                  </DialogTitle>

                  <DialogDescription className="text-xs sm:text-sm text-[#9b8e7e]">
                    {selectedSeries.summary}
                  </DialogDescription>
                </DialogHeader>

                {/* Grade de Capítulos da Série */}
                <div className="my-5 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar flex-1">
                  {selectedSeries.chapters.map((ch) => {
                    const refText = ch.verse_start
                      ? `${ch.book_name} ${ch.chapter}:${ch.verse_start}${ch.verse_end ? `-${ch.verse_end}` : ""}`
                      : `${ch.book_name} ${ch.chapter}`;
                    const targetLink = `/nvi/${ch.book_slug.toLowerCase()}/${ch.chapter}${
                      ch.verse_start ? `#v${ch.verse_start}` : ""
                    }`;

                    return (
                      <div
                        key={ch.chapter_number}
                        className="rounded-xl border border-[#382f23]/70 bg-[#1c1814]/80 p-4 sm:p-5 transition-all hover:border-[#c69a50]/50 hover:bg-[#201b17] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[0.68rem] uppercase tracking-wider text-[#e5b869]">
                              Capítulo {ch.chapter_number}
                            </span>
                            <span className="text-neutral-500 text-xs">&bull;</span>
                            <span className="text-xs text-[#d5c7b5] flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-[#e5b869]" />
                              {refText}
                            </span>
                          </div>

                          <h4 className="font-serif text-base text-[#f5f5f0] font-normal">
                            {ch.title}
                          </h4>

                          <p className="text-xs text-[#8f8272] line-clamp-2 leading-relaxed font-sans">
                            {ch.intro_text}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChapterForReading({
                                title: ch.title,
                                seriesName: selectedSeries.name,
                                chapterNumber: ch.chapter_number,
                                referenceText: refText,
                                introText: ch.intro_text,
                                targetLink,
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-full border border-[#382f23] hover:border-[#e5b869]/50 text-[0.72rem] text-[#d5c7b5] hover:text-[#e5b869] transition-colors cursor-pointer"
                          >
                            Reflexão
                          </button>

                          <Link
                            to={targetLink}
                            onClick={() => setSelectedSeries(null)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#e5b869] hover:bg-[#d8a855] text-[#161412] text-[0.72rem] font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            <span>Ler</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#382f23]/60 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSeries(null)}
                    className="px-5 py-2 rounded-full border border-[#382f23] text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* MODAL 3: REFLEXÃO DE UM CAPÍTULO ESPECÍFICO DE UMA SÉRIE           */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <Dialog
          open={!!selectedChapterForReading}
          onOpenChange={(open) => !open && setSelectedChapterForReading(null)}
        >
          <DialogContent className="max-w-xl sm:max-w-2xl border-[#382f23] bg-[#161412] text-[#f5f5f0] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            {selectedChapterForReading && (
              <>
                <DialogHeader className="space-y-2 text-left border-b border-[#382f23]/60 pb-4 shrink-0">
                  <span className="font-mono text-[0.62rem] sm:text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-[#e5b869]">
                    {selectedChapterForReading.seriesName} &bull; Capítulo {selectedChapterForReading.chapterNumber}
                  </span>

                  <DialogTitle className="font-serif text-xl sm:text-2xl font-normal text-[#f5f5f0] leading-snug">
                    {selectedChapterForReading.title}
                  </DialogTitle>

                  <DialogDescription className="sr-only">
                    Reflexão sobre {selectedChapterForReading.referenceText}
                  </DialogDescription>

                  <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700/60 bg-neutral-900/60 px-3 py-1 text-[0.72rem] text-neutral-300 w-fit mt-1">
                    <BookOpen className="h-3.5 w-3.5 text-[#e5b869]" />
                    <span className="font-sans font-medium tracking-wide">
                      {selectedChapterForReading.referenceText}
                    </span>
                  </div>
                </DialogHeader>

                <div className="my-5 overflow-y-auto pr-2 space-y-4 font-serif text-sm sm:text-base text-neutral-200/90 leading-relaxed custom-scrollbar flex-1">
                  {selectedChapterForReading.introText.split("\n\n").filter(Boolean).map((p, idx) => (
                    <p key={idx} className="font-light leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#382f23]/60 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedChapterForReading(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#382f23] text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>

                  <Link
                    to={selectedChapterForReading.targetLink}
                    onClick={() => {
                      setSelectedChapterForReading(null);
                      setSelectedSeries(null);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#e5b869] px-6 py-2.5 text-xs font-semibold text-[#121110] shadow-md hover:bg-[#d8a855] transition-all cursor-pointer"
                  >
                    <span>Ler capítulo na Bíblia ({selectedChapterForReading.referenceText})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
