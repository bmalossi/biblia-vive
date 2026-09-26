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
        "group relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-border/80 bg-app-surface shadow-lg hover:border-gold/60 transition-all duration-300 cursor-pointer",
        className
      )}
    >
      {/* Coluna Esquerda: Miniatura Atmosférica das Montanhas com Raio de Sol */}
      <div className="relative w-full md:w-48 lg:w-56 shrink-0 h-44 md:h-auto overflow-hidden select-none">
        <img
          src="/images/jornadas-mountain-hero.jpg"
          alt="Nascer do sol sobre as montanhas"
          className="h-full w-full object-cover object-center opacity-70 dark:opacity-100 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-app-surface/30 to-app-surface" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,hsl(var(--bg-surface))_100%)]" />

        {/* Badge 'MEMÓRIA EM DESTAQUE' sobreposto à imagem no topo */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-app-surface/85 border border-gold/40 backdrop-blur-xs text-[0.65rem] font-mono uppercase tracking-wider text-gold">
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
              <span className="px-2.5 py-0.5 rounded-full bg-app-raised border border-border text-[0.65rem] font-mono uppercase tracking-wider text-gold">
                {catInfo.label}
              </span>

              {/* Data */}
              <span className="text-[0.72rem] font-sans text-app-text-muted">
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
                "p-1 rounded-full hover:bg-app-raised transition-colors cursor-pointer",
                entry.favorite ? "text-gold fill-gold" : "text-app-text-muted hover:text-gold"
              )}
              aria-label={entry.favorite ? "Desfavoritar marco" : "Favoritar marco"}
            >
              <Bookmark className={cn("w-4 h-4", entry.favorite && "fill-current")} />
            </button>
          </div>

          {/* Título */}
          <h3 className="font-serif text-lg sm:text-xl font-normal text-app-text leading-snug group-hover:text-gold transition-colors">
            {entry.title || (hasRef ? `${entry.bookName} ${entry.chapter}` : "Marco de Fé")}
          </h3>

          {/* Conteúdo / Excerto */}
          <p className="font-sans text-xs sm:text-[0.82rem] text-app-text-muted leading-relaxed line-clamp-3 mt-1.5">
            {entry.content}
          </p>
        </div>

        {/* Rodapé: Referência Bíblica, Tags e Ações */}
        <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pílula com Link para a Bíblia */}
            {hasRef && (
              <Link
                to={getBibleLink(entry)}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-app-raised border border-gold/40 text-[0.7rem] text-gold hover:bg-gold/10 transition-colors"
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
                className="px-2 py-0.5 rounded-full bg-app-raised border border-border text-[0.65rem] text-app-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-1 ml-auto shrink-0 text-app-text-muted">
            {/* Compartilhar */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-full hover:bg-app-raised hover:text-app-text transition-colors cursor-pointer"
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
                  className="p-1.5 rounded-full hover:bg-app-raised hover:text-app-text transition-colors cursor-pointer"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 bg-app-surface border border-border text-app-text shadow-xl rounded-xl p-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {hasRef && (
                  <DropdownMenuItem
                    onClick={() => navigate(getBibleLink(entry))}
                    className="cursor-pointer gap-2 py-2 hover:bg-app-raised hover:text-gold"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-app-text-muted" />
                    <span>Ler na Bíblia</span>
                  </DropdownMenuItem>
                )}

                {isPrayer && !isAnswered && onMarkAnswered && (
                  <DropdownMenuItem
                    onClick={() => onMarkAnswered(entry)}
                    className="cursor-pointer gap-2 py-2 text-gold hover:bg-app-raised"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                    <span>Marcar respondida</span>
                  </DropdownMenuItem>
                )}

                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(entry)}
                    className="cursor-pointer gap-2 py-2 hover:bg-app-raised"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-app-text-muted" />
                    <span>Editar marco</span>
                  </DropdownMenuItem>
                )}

                {onDelete && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-border" />
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
