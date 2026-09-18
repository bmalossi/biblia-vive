import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  MoreVertical,
  Star,
  ExternalLink,
  Edit3,
  Trash2,
  Tag as TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialCategory, MemorialEntry } from "@/lib/noteStore";
import { MEMORIAL_CATEGORY_CONFIG, getBibleLink, hasBibleReference, formatBibleReference } from "@/lib/memorialUtils";
import SpotlightCard from "@/components/memorial/SpotlightCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface MemorialCardProps {
  entry: MemorialEntry;
  onCardClick?: (entry: MemorialEntry) => void;
  onMarkAnswered?: (entry: MemorialEntry) => void;
  onToggleFavorite?: (entry: MemorialEntry) => void;
  onEdit?: (entry: MemorialEntry) => void;
  onDelete?: (entry: MemorialEntry) => void;
  className?: string;
}

export const MemorialCard: React.FC<MemorialCardProps> = ({
  entry,
  onCardClick,
  onMarkAnswered,
  onToggleFavorite,
  onEdit,
  onDelete,
  className = "",
}) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const category = (entry.type as MemorialCategory) || "reflection";
  const catInfo = MEMORIAL_CATEGORY_CONFIG[category] || MEMORIAL_CATEGORY_CONFIG.reflection;
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

  return (
    <>
      <SpotlightCard
        data-testid="memorial-card"
        onClick={handleCardClick}
        spotlightColor="rgba(229, 184, 105, 0.12)"
        className={cn(
          "p-5 space-y-3 cursor-pointer rounded-2xl border border-[#382f23]/80 bg-[#161412] shadow-lg hover:border-[#c69a50]/60 hover:-translate-y-0.5 transition-all group",
          className
        )}
      >
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Badge da Categoria */}
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full border text-[0.68rem] font-mono uppercase tracking-wider",
                category === "prayer"
                  ? "bg-[#251e18] border-[#e5b869]/30 text-[#e5b869]"
                  : category === "testimony"
                  ? "bg-[#18231c] border-emerald-500/30 text-emerald-400"
                  : category === "fasting"
                  ? "bg-[#221c18] border-amber-500/30 text-amber-400"
                  : "bg-[#241e18] border-[#382f23] text-[#c4b5a2]"
              )}
            >
              {catInfo.label}
            </span>

            {/* Data do Registro */}
            <span className="text-[0.72rem] font-sans text-[#8f8272]">
              {formatDate(entry.createdAt)}
            </span>

            {/* Indicador de Favorito */}
            {entry.favorite && (
              <span title="Marco Favorito" aria-label="Marco Favorito">
                <Star className="h-3.5 w-3.5 text-[#e5b869] fill-[#e5b869]" />
                <span className="sr-only">Marco Favorito</span>
              </span>
            )}
          </div>

          {/* Menu Contextual */}
          <div className="flex items-center gap-1.5 shrink-0 text-[#8f8272]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mais opções"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md hover:bg-app-raised hover:text-app-text transition-colors cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-app-surface border border-border shadow-md rounded-xl p-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {hasRef && (
                  <DropdownMenuItem
                    onClick={() => navigate(getBibleLink(entry))}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-app-text-muted" />
                    <span>Abrir no texto bíblico</span>
                  </DropdownMenuItem>
                )}

                {onToggleFavorite && (
                  <DropdownMenuItem
                    onClick={() => onToggleFavorite(entry)}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5",
                        entry.favorite
                          ? "text-gold fill-gold"
                          : "text-app-text-muted"
                      )}
                    />
                    <span>
                      {entry.favorite ? "Desfavoritar" : "Favoritar marco"}
                    </span>
                  </DropdownMenuItem>
                )}

                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(entry)}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-app-text-muted" />
                    <span>Editar marco</span>
                  </DropdownMenuItem>
                )}

                {onDelete && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-border/60" />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Excluir marco</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Título opcional */}
        {entry.title && (
          <h3 className="text-base sm:text-[1.02rem] font-serif font-medium text-[#f4efea] leading-snug group-hover:text-[#e5b869] transition-colors">
            {entry.title}
          </h3>
        )}

        {/* Conteúdo do Registro */}
        <p className="text-xs sm:text-[0.82rem] text-[#9b8e7e] leading-relaxed line-clamp-3">
          {entry.content}
        </p>

        {/* Referência Bíblica (apenas se vinculada) */}
        {hasRef && (
          <div className="pt-0.5">
            <Link
              to={getBibleLink(entry)}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1e1914] border border-[#c69a50]/40 text-[0.7rem] text-[#e5b869] hover:bg-[#282119] transition-colors"
              title="Ir para o texto bíblico"
            >
              <span>{formatBibleReference(entry)}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </Link>
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#1c1813] border border-[#382f23] text-[0.65rem] text-[#8f8272]"
              >
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Área de Oração: Botão de Resposta OU Testemunho Respondido */}
        {isPrayer && (
          <div className="pt-2 border-t border-[#382f23]/50">
            {!isAnswered ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[0.72rem] text-[#8f8272] italic">
                  Oração em espera perante Deus
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAnswered?.(entry);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e5b869]/40 bg-[#e5b869]/10 text-[#e5b869] hover:bg-[#e5b869] hover:text-[#161412] transition-all text-xs font-medium cursor-pointer shadow-xs active:scale-95"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Marcar como respondida</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Oração Respondida</span>
                  {entry.answeredAt && (
                    <span className="text-[0.7rem] text-[#8f8272] opacity-80 ml-auto">
                      {formatDate(entry.answeredAt)}
                    </span>
                  )}
                </div>
                {entry.answeredNote && (
                  <p className="text-xs text-[#9b8e7e] italic leading-relaxed pl-5">
                    "{entry.answeredNote}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* Diálogo Protetor de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este marco do Memorial?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta memória espiritual será excluída permanentemente do seu Altar. Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteDialogOpen(false);
                onDelete?.(entry);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir marco
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemorialCard;
