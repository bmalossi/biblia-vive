import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Bookmark, Share2, MoreHorizontal, ExternalLink, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialEntry, MemorialCategory } from "@/lib/noteStore";
import { MEMORIAL_CATEGORY_CONFIG, getBibleLink, hasBibleReference, formatBibleReference } from "@/lib/memorialUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MemorialFeaturedCardProps {
  entry: MemorialEntry;
  onCardClick?: (entry: MemorialEntry) => void;
  onToggleFavorite?: (entry: MemorialEntry) => void;
  onMarkAnswered?: (entry: MemorialEntry) => void;
  onEdit?: (entry: MemorialEntry) => void;
  onDelete?: (entry: MemorialEntry) => void;
  className?: string;
}

export default function MemorialFeaturedCard({
  entry,
  onCardClick,
  onToggleFavorite,
  onMarkAnswered,
  onEdit,
  onDelete,
  className,
}: MemorialFeaturedCardProps) {
  const navigate = useNavigate();

  const category = (entry.type as MemorialCategory) || "testimony";
  const catInfo = MEMORIAL_CATEGORY_CONFIG[category] || MEMORIAL_CATEGORY_CONFIG.testimony;
  const isPrayer = category === "prayer";
  const isAnswered = Boolean(entry.answeredAt);
  const hasRef = hasBibleReference(entry);

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(entry);
    } else {
      navigate(`/memorial/${entry.id}`);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: entry.title || "Meu Memorial — Bíblia Vive",
        text: `${entry.title ? entry.title + "\n\n" : ""}${entry.content}\n\n— Bíblia Vive`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${entry.title ? entry.title + "\n\n" : ""}${entry.content}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-[#382f23]/80 bg-[#161412] shadow-xl hover:border-[#c69a50]/60 transition-all duration-300 cursor-pointer",
        className
      )}
    >
      {/* Coluna Esquerda: Miniatura Atmosférica das Montanhas com Raio de Sol */}
      <div className="relative w-full md:w-48 lg:w-56 shrink-0 h-44 md:h-auto overflow-hidden select-none">
        <img
          src="/images/jornadas-mountain-hero.jpg"
          alt="Nascer do sol sobre as montanhas"
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-[#161412]/30 to-[#161412]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#161412_100%)]" />

        {/* Badge 'MEMÓRIA EM DESTAQUE' sobreposto à imagem no topo */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#161412]/85 border border-[#e5b869]/40 backdrop-blur-xs text-[0.65rem] font-mono uppercase tracking-wider text-[#e5b869]">
          <Star className="w-3 h-3 fill-current" />
          <span>Destaque</span>
        </div>
      </div>

      {/* Coluna Direita: Informações e Conteúdo do Registro */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-3">
        <div>
          {/* Linha Superior: Badges e Data */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge da Categoria */}
              <span className="px-2.5 py-0.5 rounded-full bg-[#241e18] border border-[#382f23] text-[0.65rem] font-mono uppercase tracking-wider text-[#e5b869]">
                {catInfo.label}
              </span>

              {/* Data */}
              <span className="text-[0.72rem] font-sans text-[#8f8272]">
                {formatDate(entry.createdAt)}
              </span>
            </div>

            {/* Marcador de Favorito */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(entry);
              }}
              className={cn(
                "p-1 rounded-full hover:bg-[#201b16] transition-colors cursor-pointer",
                entry.favorite ? "text-[#e5b869] fill-[#e5b869]" : "text-[#8f8272] hover:text-[#e5b869]"
              )}
              aria-label={entry.favorite ? "Desfavoritar marco" : "Favoritar marco"}
            >
              <Bookmark className={cn("w-4 h-4", entry.favorite && "fill-current")} />
            </button>
          </div>

          {/* Título */}
          <h3 className="font-serif text-lg sm:text-xl font-normal text-[#f4efea] leading-snug group-hover:text-[#e5b869] transition-colors">
            {entry.title || (hasRef ? `${entry.bookName} ${entry.chapter}` : "Marco de Fé")}
          </h3>

          {/* Conteúdo / Excerto */}
          <p className="font-sans text-xs sm:text-[0.82rem] text-[#9b8e7e] leading-relaxed line-clamp-3 mt-1.5">
            {entry.content}
          </p>
        </div>

        {/* Rodapé: Referência Bíblica, Tags e Ações */}
        <div className="pt-2 border-t border-[#382f23]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pílula com Link para a Bíblia */}
            {hasRef && (
              <Link
                to={getBibleLink(entry)}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1e1914] border border-[#c69a50]/40 text-[0.7rem] text-[#e5b869] hover:bg-[#282119] transition-colors"
                title="Abrir texto na Bíblia"
              >
                <span>{formatBibleReference(entry)}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </Link>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-[#1e1914]/80 border border-[#382f23] text-[0.65rem] text-[#8f8272]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-1 ml-auto shrink-0 text-[#8f8272]">
            {/* Compartilhar */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-full hover:bg-[#201b16] hover:text-[#f4efea] transition-colors cursor-pointer"
              title="Compartilhar memória"
              aria-label="Compartilhar memória"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Menu Dropdown de Mais Opções */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-full hover:bg-[#201b16] hover:text-[#f4efea] transition-colors cursor-pointer"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 bg-[#161412] border border-[#382f23] text-[#f4efea] shadow-xl rounded-xl p-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {hasRef && (
                  <DropdownMenuItem
                    onClick={() => navigate(getBibleLink(entry))}
                    className="cursor-pointer gap-2 py-2 hover:bg-[#201b16] hover:text-[#e5b869]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#8f8272]" />
                    <span>Ler na Bíblia</span>
                  </DropdownMenuItem>
                )}

                {isPrayer && !isAnswered && onMarkAnswered && (
                  <DropdownMenuItem
                    onClick={() => onMarkAnswered(entry)}
                    className="cursor-pointer gap-2 py-2 text-[#e5b869] hover:bg-[#201b16]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e5b869]" />
                    <span>Marcar respondida</span>
                  </DropdownMenuItem>
                )}

                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(entry)}
                    className="cursor-pointer gap-2 py-2 hover:bg-[#201b16]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#8f8272]" />
                    <span>Editar marco</span>
                  </DropdownMenuItem>
                )}

                {onDelete && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-[#382f23]" />
                    <DropdownMenuItem
                      onClick={() => onDelete(entry)}
                      className="cursor-pointer gap-2 py-2 text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir marco</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
