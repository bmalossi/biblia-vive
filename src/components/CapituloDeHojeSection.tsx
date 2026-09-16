import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEditorialChapter } from "@/hooks/useEditorialChapter";
import {
  getEditorialChapterLink,
  getEditorialChapterReferenceText,
} from "@/types/editorialChapter";
import { BookOpen, ArrowRight, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function CapituloDeHojeSection() {
  const { chapter } = useEditorialChapter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dados reais com fallback para os dados da imagem de referência
  const seriesName = chapter?.series_name ? chapter.series_name.toUpperCase() : "ESCUTA";
  const title = chapter?.title || "A Palavra não é um texto distante";
  
  const introFullText =
    chapter?.intro_text ||
    `Você não abre as Escrituras como quem observa uma história que aconteceu apenas com outras pessoas. Aquilo que foi escrito permanece diante de você.

As narrativas bíblicas não são relíquias protegidas por vitrines antigas nem ideias abstratas sobre o passado. Quando Deus fala através das Escrituras, Ele se dirige ao presente, tocando a vida de quem escuta com atenção.

Permanecer diante do texto é permitir que a esperança seja renovada e que a verdade divina encontre morada viva em seu coração hoje.`;

  const paragraphs = introFullText.split("\n\n").filter(Boolean);
  const rawPreview = paragraphs[0] || "";

  // Delimitação estrita a no máximo 2 linhas (~18-20 palavras)
  const previewText = useMemo(() => {
    const clean = rawPreview.replace(/\s+/g, " ").trim();
    const words = clean.split(" ");
    if (words.length <= 20) return clean;
    return words.slice(0, 20).join(" ").replace(/[,.;:—-]+$/, "") + "...";
  }, [rawPreview]);

  const referenceText = chapter ? getEditorialChapterReferenceText(chapter) : "Romanos 15.4";
  const targetLink = chapter ? getEditorialChapterLink(chapter) : "/nvi/romanos/15";

  return (
    <section aria-label="Capítulo de Hoje" className="w-full">
      {/* Card Clicável com Efeito Hover */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        aria-label={`Ler reflexão completa: ${title}`}
        className="group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[#382f23]/80 bg-gradient-to-br from-[#1c1814] via-[#151311] to-[#100f0d] p-5 sm:p-6 md:p-7 lg:p-8 shadow-xl cursor-pointer hover:border-gold/50 hover:shadow-2xl hover:shadow-gold/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/60 select-none"
      >
        {/* Detalhes modernos: Arcos Concêntricos Dourados no Lado Direito */}
        <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 h-[150%] w-1/2 max-w-[380px] select-none overflow-hidden flex items-center justify-end">
          <svg
            className="h-full w-full opacity-35 transition-opacity duration-300 group-hover:opacity-45"
            viewBox="0 0 360 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="goldRingGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#bfa152" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#695627" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <circle cx="340" cy="140" r="90" stroke="url(#goldRingGlow)" strokeWidth="1.2" />
            <circle cx="340" cy="140" r="140" stroke="url(#goldRingGlow)" strokeWidth="1.2" />
            <circle cx="340" cy="140" r="190" stroke="url(#goldRingGlow)" strokeWidth="1.2" />
            <circle cx="340" cy="140" r="240" stroke="url(#goldRingGlow)" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
        </div>

        {/* Conteúdo Principal do Banner */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Coluna Esquerda: Informações do Capítulo */}
          <div className="max-w-xl">
            {/* Overline com categoria e movimento */}
            <div className="flex items-center gap-2 mb-2">
              <p className="font-mono text-[0.62rem] sm:text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold/80">
                CAPÍTULO DE HOJE &bull; {seriesName}
              </p>
              <span className="hidden sm:inline-flex items-center gap-1 text-[0.65rem] text-gold/60 bg-gold/5 px-2 py-0.5 rounded-full border border-gold/20 group-hover:border-gold/40 group-hover:text-gold transition-colors">
                <FileText className="h-2.5 w-2.5" />
                Toque para ler completo
              </span>
            </div>

            {/* Título Principal em Tipografia Clássica */}
            <h2 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-[1.75rem] font-normal leading-snug tracking-tight text-[#f5f5f0] mb-2.5 text-balance group-hover:text-gold-light transition-colors">
              {title}
            </h2>

            {/* Parágrafo de Introdução / Reflexão com indicador delimitado a 2 linhas */}
            <p className="font-sans text-xs sm:text-[0.82rem] text-neutral-300/80 leading-relaxed mb-3 font-light max-w-lg line-clamp-2">
              {previewText}
            </p>

            {/* Barra inferior de tags e ação de abrir */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tag / Pílula da Referência Bíblica */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700/60 bg-neutral-900/40 px-2.5 py-1 text-[0.7rem] text-neutral-300 backdrop-blur-xs">
                <BookOpen className="h-3 w-3 text-gold/90" />
                <span className="font-sans font-medium tracking-wide">{referenceText}</span>
              </div>

              {/* Botão de chamada para o texto completo */}
              <span className="inline-flex items-center gap-1 text-[0.7rem] text-gold/90 group-hover:text-gold font-medium ml-1 transition-colors">
                Ler reflexão completa &rarr;
              </span>
            </div>
          </div>

          {/* Coluna Centro-Direita: Ações CTA */}
          <div className="flex flex-col items-start lg:items-center justify-center shrink-0 pr-0 lg:pr-10">
            <Link
              to={targetLink}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-5 py-2 text-xs font-semibold text-[#121110] shadow-sm transition-all duration-200 hover:bg-gold/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Ler capítulo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              to="/jornadas"
              onClick={(e) => e.stopPropagation()}
              className="group/jornada inline-flex items-center gap-1 mt-2 text-[0.7rem] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <span>Ver toda a jornada</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover/jornada:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Popup com o Texto Completo da Reflexão */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl border-[#382f23] bg-[#161412] text-[#f5f5f0] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
          <DialogHeader className="space-y-2 text-left border-b border-[#382f23]/60 pb-4 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[0.62rem] sm:text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold">
                CAPÍTULO DE HOJE &bull; {seriesName}
              </span>
            </div>

            <DialogTitle className="font-serif text-xl sm:text-2xl md:text-[1.65rem] font-normal text-[#f5f5f0] leading-snug">
              {title}
            </DialogTitle>

            <DialogDescription className="sr-only">
              Texto completo da reflexão do capítulo de hoje sobre {referenceText}
            </DialogDescription>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700/60 bg-neutral-900/60 px-3 py-1 text-[0.72rem] text-neutral-300 w-fit mt-1">
              <BookOpen className="h-3.5 w-3.5 text-gold" />
              <span className="font-sans font-medium tracking-wide">{referenceText}</span>
            </div>
          </DialogHeader>

          {/* Conteúdo com os Parágrafos Completos da Reflexão */}
          <div className="my-5 overflow-y-auto pr-2 space-y-4 font-serif text-sm sm:text-base text-neutral-200/90 leading-relaxed custom-scrollbar flex-1">
            {paragraphs.map((para, index) => (
              <p key={index} className="text-balance font-light leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Rodapé com CTA para Leitura Bíblica e Fechar */}
          <div className="pt-4 border-t border-[#382f23]/60 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#382f23] text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <Link
              to={targetLink}
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-[#121110] shadow-md hover:bg-gold/90 transition-all cursor-pointer"
            >
              <span>Ler capítulo na Bíblia ({referenceText})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

