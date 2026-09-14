// ─────────────────────────────────────────────────────────────────────────────
// MemorialNoteModal.tsx — Bíblia Vive · Meu Memorial
//
// Modal / Drawer expansivo com efeito Scale In Card na Linha Sagrada.
// Desdobra suavemente o registro em cadência solene (350ms - 400ms) sem
// recarregar a página, preservando a posição exata de rolagem do leitor.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Star,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialCategory, MemorialEntry } from "@/lib/noteStore";
import {
  MEMORIAL_CATEGORY_CONFIG,
  getBibleLink,
  hasBibleReference,
} from "@/lib/memorialUtils";
import ScaleInCard from "./ScaleInCard";
import BorderGlow from "./BorderGlow";
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

export interface MemorialNoteModalProps {
  note: MemorialEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAnswered?: (entry: MemorialEntry) => void;
  onToggleFavorite?: (entry: MemorialEntry) => void;
  onEdit?: (entry: MemorialEntry) => void;
  onDelete?: (entry: MemorialEntry) => void;
}

export const MemorialNoteModal: React.FC<MemorialNoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onMarkAnswered,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Detecta viewport mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Preserva scroll e previne rolagem do body quando aberto
  useEffect(() => {
    if (!isOpen || !note) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, note]);

  // Fechamento via tecla Escape
  useEffect(() => {
    if (!isOpen || !note) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, note, onClose]);

  const handleCopy = useCallback(async () => {
    if (!note) return;
    const category = (note.type as MemorialCategory) || "reflection";
    const catInfo = MEMORIAL_CATEGORY_CONFIG[category] || MEMORIAL_CATEGORY_CONFIG.reflection;
    const dateFormatted = formatDateLong(note.createdAt);
    const refText = hasBibleReference(note)
      ? `${note.bookName} ${note.chapter}${note.verse ? `:${note.verse}` : ""}`
      : "";

    let text = refText
      ? `${catInfo.label} • ${refText}\n${dateFormatted}\n\n`
      : `${catInfo.label}\n${dateFormatted}\n\n`;

    if (note.title) text += `${note.title}\n\n`;

    const soapMeta = note.metadata?.soap;
    const hasSoap = Boolean(
      note.type === "reflection" &&
        soapMeta &&
        (soapMeta.scripture || soapMeta.observation || soapMeta.application || soapMeta.prayer)
    );

    if (hasSoap && soapMeta) {
      const parts = [
        (soapMeta.scripture || note.verseText) ? `Escritura (S):\n"${soapMeta.scripture || note.verseText}"` : "",
        soapMeta.observation ? `Observação (O):\n${soapMeta.observation}` : "",
        soapMeta.application ? `Aplicação (A):\n${soapMeta.application}` : "",
        soapMeta.prayer ? `Oração (P):\n${soapMeta.prayer}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      text += parts || note.content;
    } else {
      text += note.content;
    }

    if (note.answeredAt && note.answeredNote) {
      text += `\n\nOração Respondida (${formatDateLong(note.answeredAt)}):\n${note.answeredNote}`;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar marco:", err);
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const category = (note.type as MemorialCategory) || "reflection";
  const catInfo = MEMORIAL_CATEGORY_CONFIG[category] || MEMORIAL_CATEGORY_CONFIG.reflection;
  const isPrayer = category === "prayer";
  const isAnswered = Boolean(note.answeredAt);
  const hasRef = hasBibleReference(note);

  const soapMeta = note.metadata?.soap;
  const hasSoap = Boolean(
    note.type === "reflection" &&
      soapMeta &&
      (soapMeta.scripture || soapMeta.observation || soapMeta.application || soapMeta.prayer)
  );

  return (
    <>
      <AnimatePresence>
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memorial-note-title"
        >
          {/* Backdrop Desfocado Solene */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Versão Desktop (md+): Modal Centralizado com Scale In e BorderGlow */}
          {!isMobile ? (
            <div className="relative z-10 w-full max-w-2xl px-4 my-auto pointer-events-auto">
              <ScaleInCard>
                <BorderGlow className="border border-gold/30">
                  <div className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                    {/* Topo do Modal: Badges, Referência, Data e Ações */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={cn(
                              "inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold tracking-wide",
                              catInfo.classes
                            )}
                          >
                            {catInfo.label}
                          </span>

                          {/* Referência Bíblica (apenas se houver vínculo) */}
                          {hasRef && (
                            <Link
                              to={getBibleLink(note)}
                              className="inline-flex items-center gap-1.5 text-sm font-serif font-semibold text-gold hover:underline"
                              title="Abrir passagem bíblica"
                            >
                              <span>
                                {note.bookName} {note.chapter}
                                {note.verse ? `:${note.verse}` : ""}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                            </Link>
                          )}
                        </div>

                        <p className="text-xs text-app-text-muted font-serif">
                          {formatDateLong(note.createdAt)}
                        </p>
                      </div>

                      {/* Ações de Topo */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(note)}
                            title={note.favorite ? "Desfavoritar marco" : "Favoritar marco"}
                            aria-label={note.favorite ? "Desfavoritar marco" : "Favoritar marco"}
                            className="p-2 rounded-xl text-app-text-muted hover:text-gold hover:bg-app-raised transition-colors cursor-pointer"
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                note.favorite
                                  ? "text-gold fill-gold"
                                  : "text-app-text-muted"
                              )}
                            />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleCopy}
                          title="Copiar texto"
                          aria-label="Copiar texto"
                          className="p-2 rounded-xl text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors cursor-pointer"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          title="Fechar"
                          aria-label="Fechar"
                          className="p-2 rounded-xl text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Título opcional */}
                    {note.title && (
                      <h2
                        id="memorial-note-title"
                        className="text-xl md:text-2xl font-serif font-bold text-app-text tracking-tight"
                      >
                        {note.title}
                      </h2>
                    )}

                    {/* Versículo citado (quando não for SOAP estruturado) */}
                    {note.verseText && !hasSoap && (
                      <blockquote className="pl-4 border-l-2 border-gold/40 text-app-text-muted italic text-sm md:text-base leading-relaxed font-serif">
                        "{note.verseText}"
                      </blockquote>
                    )}

                    {/* Conteúdo do Registro (sem player de áudio — apenas texto transcrito) */}
                    {!hasSoap ? (
                      <div className="text-base text-app-text font-serif leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </div>
                    ) : (
                      /* Registro único estruturado SOAP */
                      <div className="rounded-2xl border border-border bg-app-raised/40 p-5 md:p-6 space-y-4 text-sm font-sans">
                        {(soapMeta?.scripture || note.verseText) && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                              Escritura (S)
                            </h4>
                            <p className="text-app-text font-serif leading-relaxed">
                              {soapMeta?.scripture || note.verseText}
                            </p>
                          </div>
                        )}
                        {soapMeta?.observation && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                              Observação (O)
                            </h4>
                            <p className="text-app-text font-serif leading-relaxed">
                              {soapMeta.observation}
                            </p>
                          </div>
                        )}
                        {soapMeta?.application && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                              Aplicação (A)
                            </h4>
                            <p className="text-app-text font-serif leading-relaxed">
                              {soapMeta.application}
                            </p>
                          </div>
                        )}
                        {soapMeta?.prayer && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                              Oração (P)
                            </h4>
                            <p className="text-app-text font-serif leading-relaxed">
                              {soapMeta.prayer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Seção de Oração: Ação de Resposta OU Testemunho Respondido */}
                    {isPrayer && (
                      <div className="pt-2">
                        {!isAnswered ? (
                          <div className="p-4 rounded-2xl border border-gold/30 bg-gold/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="space-y-0.5 text-center sm:text-left">
                              <span className="text-xs font-medium text-app-text">
                                Oração em espera perante Deus
                              </span>
                              <p className="text-[0.75rem] text-app-text-muted">
                                Registrada neste Altar sagrado
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onMarkAnswered?.(note);
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gold bg-gold text-black font-semibold text-xs hover:bg-gold/90 transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Marcar como Oração Respondida</span>
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 md:p-5 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs md:text-sm">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              <span>
                                Oração Respondida • {formatDateLong(note.answeredAt!)}
                              </span>
                            </div>
                            {note.answeredNote && (
                              <p className="text-xs md:text-sm text-app-text font-serif italic pl-6 leading-relaxed">
                                "{note.answeredNote}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rodapé com Ações do Altar */}
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-4 text-xs text-app-text-muted">
                      <div className="flex items-center gap-3">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(note)}
                            className="inline-flex items-center gap-1.5 hover:text-app-text transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-app-raised"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Editar marco</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1.5 hover:text-app-text transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-app-raised"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copiado ✓</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteDialogOpen(true)}
                          className="inline-flex items-center gap-1.5 text-destructive/80 hover:text-destructive transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-app-raised"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                </BorderGlow>
              </ScaleInCard>
            </div>
          ) : (
            /* Versão Mobile (< md): Bottom Sheet / Drawer com gesto de swipe down */
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  onClose();
                }
              }}
              initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
              animate={
                shouldReduceMotion
                  ? { opacity: 1, transition: { duration: 0.38, ease: "easeOut" } }
                  : {
                      y: 0,
                      opacity: 1,
                      transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                    }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }
                  : {
                      y: "100%",
                      opacity: 0,
                      transition: { duration: 0.25, ease: "easeOut" },
                    }
              }
              className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] rounded-t-3xl bg-app-surface border-t border-gold/30 shadow-[0_-10px_35px_rgba(217,119,6,0.15)] flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Handle superior de swipe down */}
              <div className="py-2.5 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-border/80" />
              </div>

              {/* Conteúdo Rolável no Mobile */}
              <div className="overflow-y-auto px-5 pt-1 pb-6 space-y-5 flex-1 overscroll-contain">
                {/* Topo do Drawer */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full border text-[0.7rem] font-semibold",
                          catInfo.classes
                        )}
                      >
                        {catInfo.label}
                      </span>

                      {/* Referência Bíblica (apenas se vinculada) */}
                      {hasRef && (
                        <Link
                          to={getBibleLink(note)}
                          className="inline-flex items-center gap-1 text-xs font-serif font-semibold text-gold"
                        >
                          <span>
                            {note.bookName} {note.chapter}
                            {note.verse ? `:${note.verse}` : ""}
                          </span>
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </Link>
                      )}
                    </div>

                    <p className="text-[0.72rem] text-app-text-muted font-serif">
                      {formatDateLong(note.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(note)}
                        aria-label="Favoritar marco"
                        className="p-1.5 rounded-lg text-app-text-muted hover:text-gold cursor-pointer"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            note.favorite ? "text-gold fill-gold" : "text-app-text-muted"
                          )}
                        />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Fechar"
                      className="p-1.5 rounded-lg text-app-text-muted hover:text-app-text cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Título */}
                {note.title && (
                  <h2
                    id="memorial-note-title"
                    className="text-lg font-serif font-bold text-app-text tracking-tight"
                  >
                    {note.title}
                  </h2>
                )}

                {/* Versículo */}
                {note.verseText && !hasSoap && (
                  <blockquote className="pl-3.5 border-l-2 border-gold/40 text-app-text-muted italic text-xs leading-relaxed font-serif">
                    "{note.verseText}"
                  </blockquote>
                )}

                {/* Conteúdo da Nota */}
                {!hasSoap ? (
                  <div className="text-sm text-app-text font-serif leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-app-raised/40 p-4 space-y-3 text-xs font-sans">
                    {(soapMeta?.scripture || note.verseText) && (
                      <div>
                        <h4 className="font-semibold uppercase tracking-wider text-gold mb-0.5">
                          Escritura (S)
                        </h4>
                        <p className="text-app-text font-serif leading-relaxed">
                          {soapMeta?.scripture || note.verseText}
                        </p>
                      </div>
                    )}
                    {soapMeta?.observation && (
                      <div>
                        <h4 className="font-semibold uppercase tracking-wider text-gold mb-0.5">
                          Observação (O)
                        </h4>
                        <p className="text-app-text font-serif leading-relaxed">
                          {soapMeta.observation}
                        </p>
                      </div>
                    )}
                    {soapMeta?.application && (
                      <div>
                        <h4 className="font-semibold uppercase tracking-wider text-gold mb-0.5">
                          Aplicação (A)
                        </h4>
                        <p className="text-app-text font-serif leading-relaxed">
                          {soapMeta.application}
                        </p>
                      </div>
                    )}
                    {soapMeta?.prayer && (
                      <div>
                        <h4 className="font-semibold uppercase tracking-wider text-gold mb-0.5">
                          Oração (P)
                        </h4>
                        <p className="text-app-text font-serif leading-relaxed">
                          {soapMeta.prayer}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Área de Oração */}
                {isPrayer && (
                  <div className="pt-1">
                    {!isAnswered ? (
                      <div className="p-3.5 rounded-xl border border-gold/30 bg-gold/5 space-y-2.5">
                        <span className="text-[0.72rem] text-app-text-muted italic block">
                          Oração em espera perante Deus
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onMarkAnswered?.(note);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-black font-semibold text-xs active:scale-95 transition-transform cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Marcar como Oração Respondida</span>
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Oração Respondida • {formatDateLong(note.answeredAt!)}</span>
                        </div>
                        {note.answeredNote && (
                          <p className="text-xs text-app-text font-serif italic pl-5 leading-relaxed">
                            "{note.answeredNote}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ações Inferiores Fixas no Rodapé do Drawer com Safe-Area */}
              <div className="px-5 py-3 border-t border-border/60 bg-app-surface/95 backdrop-blur-xs flex items-center justify-between gap-3 text-xs text-app-text-muted shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(note)}
                      className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-app-raised hover:text-app-text cursor-pointer transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-app-raised hover:text-app-text cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copiado ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 text-destructive hover:bg-destructive/10 py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      {/* Confirmação de Exclusão */}
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
                onClose();
                onDelete?.(note);
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

function formatDateLong(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default MemorialNoteModal;
