import { History, Sparkles, BookOpen, Clock, Calendar } from "lucide-react";

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
}

const precursorEvents: TimelineEvent[] = [
  {
    year: "1861",
    title: "Salmos e Hinos",
    description:
      "Publicação do hinário congregacional Salmos e Hinos, usado pela Assembleia de Deus em seus primeiros anos, junto com outros hinos protestantes tradicionais.",
  },
  {
    year: "1917–1921",
    title: "Hinários precursores",
    description:
      "Missionários suecos da AD em Belém (PA) organizam um hinário com 194 hinos (1917) e depois lançam o Cantor Pentecostal (1921), com 44 hinos e 10 corinhos, já destacando a doutrina pentecostal.",
  },
];

const harpaTimelineEvents: TimelineEvent[] = [
  {
    year: "1922",
    title: "1ª edição da Harpa Cristã",
    description:
      "Lançada pela AD em Recife (PE), torna-se o hinário oficial das Assembleias de Deus, com hinos para culto público, Santa Ceia, batismo, casamento, apresentação de crianças e cultos fúnebres; tiragem inicial de mil exemplares, distribuídos por Samuel Nyström.",
    highlight: true,
  },
  {
    year: "1923",
    title: "2ª edição (300 hinos)",
    description:
      "Impressa no Rio de Janeiro, amplia o conteúdo para 300 hinos, consolidando o uso nacional da Harpa Cristã entre as igrejas assembleianas.",
  },
  {
    year: "1932",
    title: "Ampliação para 400 hinos",
    description:
      "Novos cânticos são acrescentados e o hinário chega a 400 hinos, acompanhando o crescimento do movimento pentecostal no Brasil.",
  },
  {
    year: "1937",
    title: "Harpa Cristã com música",
    description:
      "A Convenção Geral das Assembleias de Deus, reunida em São Paulo, nomeia uma comissão (incluindo Emílio Conde, Samuel Nyström e Paulo Leivas Macalão) para elaborar a primeira Harpa Cristã com letra e música, que se torna referência para o cântico congregacional.",
  },
  {
    year: "Décadas seguintes",
    title: "Edição clássica com 524 hinos",
    description:
      "Ao longo dos anos são acrescentados novos cânticos até chegar à famosa edição com 524 hinos; até 1981, todos foram revisados em letra e música, com grande participação do pastor Paulo Leivas Macalão.",
  },
  {
    year: "1979",
    title: "Revisão geral oficial",
    description:
      "O Conselho Administrativo da CPAD e a CGADB nomeiam uma nova comissão para revisar música e letras da Harpa Cristã, com apoio técnico especializado em correção musical e textual.",
  },
  {
    year: "1992",
    title: "Harpa Cristã Atualizada",
    description:
      "Lançada com ajustes de linguagem e forma, é adotada por algumas igrejas, mas boa parte das Assembleias de Deus mantém a Harpa Tradicional como preferida.",
  },
  {
    year: "1999",
    title: "Harpa Cristã Ampliada (640 hinos)",
    description:
      "A CPAD lança a Harpa Cristã Ampliada, acrescentando 116 novos hinos para atender melhor às necessidades cerimoniais e litúrgicas da igreja, totalizando 640 cânticos.",
  },
  {
    year: "2001–2010",
    title: "Ajuste para 636 hinos",
    description:
      "O hinário passa por nova atualização, retirando quatro hinos pátrios nacionais e fixando o número em 636 hinos.",
  },
  {
    year: "2022",
    title: "100 anos da Harpa Cristã",
    description:
      "A Harpa Cristã completa um século de existência, reconhecida como o hinário mais conhecido e amado do Brasil, ultrapassando fronteiras denominacionais e marcando a história da hinódia pentecostal.",
    highlight: true,
  },
];

function TimelineCard({ event }: { event: TimelineEvent }) {
  return (
    <div className="relative pl-6 sm:pl-8 group">
      {/* Node Bullet */}
      <div
        className={`absolute left-0 top-1.5 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border bg-app-surface transition-colors ${
          event.highlight
            ? "border-gold bg-gold/20 text-gold ring-4 ring-gold/10"
            : "border-gold/50 group-hover:border-gold group-hover:bg-gold/10"
        }`}
      >
        <div
          className={`h-1.5 w-1.5 rounded-full ${
            event.highlight ? "bg-gold" : "bg-gold/60 group-hover:bg-gold"
          }`}
        />
      </div>

      {/* Card Content */}
      <div
        className={`rounded-xl border p-4 sm:p-5 transition-all duration-200 ${
          event.highlight
            ? "border-gold/40 bg-app-surface shadow-sm hover:border-gold/60"
            : "border-border bg-app-surface/60 hover:border-gold/30 hover:bg-app-surface"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-gold">
            <Calendar className="h-3 w-3" />
            {event.year}
          </span>
          <h4 className="font-sans text-sm font-semibold text-app-text">
            {event.title}
          </h4>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-app-text-muted">
          {event.description}
        </p>
      </div>
    </div>
  );
}

export default function HarpaTimeline() {
  return (
    <section
      id="historia"
      className="scroll-mt-24 mt-14 pt-10 border-t border-border"
      aria-label="História da Harpa Cristã"
    >
      {/* Section Title & Intro */}
      <div className="mx-auto max-w-3xl text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-medium text-gold mb-3">
          <History className="h-3.5 w-3.5" />
          <span>Trajetória Centenária</span>
        </div>
        <h2 className="font-sans text-2xl font-bold tracking-tight text-app-text sm:text-3xl mb-3">
          História da Harpa Cristã
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-app-text-muted">
          A Harpa Cristã é o hinário oficial das Assembleias de Deus no Brasil, nascido em 1922 e
          continuamente ampliado e revisado até se tornar o hinário pentecostal mais conhecido do
          país.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-10">
        {/* Block 1: Precursors */}
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="font-sans text-lg font-bold text-app-text">
              Contexto anterior à Harpa Cristã
            </h3>
          </div>

          <div className="relative border-l border-gold/20 space-y-5 ml-4 sm:ml-5">
            {precursorEvents.map((event, index) => (
              <TimelineCard key={index} event={event} />
            ))}
          </div>
        </div>

        {/* Block 2: Main Timeline */}
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20">
              <BookOpen className="h-4 w-4" />
            </div>
            <h3 className="font-sans text-lg font-bold text-app-text">
              Linha do tempo da Harpa Cristã
            </h3>
          </div>

          <div className="relative border-l border-gold/20 space-y-5 ml-4 sm:ml-5">
            {harpaTimelineEvents.map((event, index) => (
              <TimelineCard key={index} event={event} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
