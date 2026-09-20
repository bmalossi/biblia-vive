// ─────────────────────────────────────────────────────────────────────────────
// ScriptureThreadModal.tsx — Bíblia Vive
//
// Modal de expansão do Fio da Escritura.
// Revela a Categoria do Fio detectada pelo JEV e apresenta a Nota Candidata
// do Meu Memorial que mais provavelmente motivou a conexão.
// Preserva com precisão a posição de leitura do Leitor ao fechar.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Network, BookOpen, ExternalLink, Info } from "lucide-react";
import type { ScriptureThreadResult } from "@/lib/scriptureThread";
import type { MemorialEntry } from "@/lib/noteStore";
import { CATEGORY_LABELS } from "./ScriptureThreadBanner";

interface ScriptureThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScriptureThreadResult | null;
  candidateNote: MemorialEntry | null;
  chapterRef: string;
}

export default function ScriptureThreadModal({
  isOpen,
  onClose,
  result,
  candidateNote,
  chapterRef,
}: ScriptureThreadModalProps) {
  // Listener para tecla Escape sem interferir no scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const categoryMeta = CATEGORY_LABELS[result.category] || {
    label: "Conexão da Escritura",
    description: "Continuidade espiritual com seu acervo de fé",
  };

  function formatDate(iso: string) {
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

  const typeLabels: Record<string, string> = {
    reflection: "Reflexão",
    prayer: "Oração",
    testimony: "Testemunho",
    fasting: "Propósito",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        {/* Overlay para clique externo */}
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          className="relative z-10 w-full max-w-xl max-h-[90vh] bg-app-surface rounded-3xl border border-gold/35 shadow-2xl overflow-hidden flex flex-col font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-app-raised/80">
            <div className="flex items-center gap-2 text-xs font-serif text-app-text-muted">
              <Network className="h-4 w-4 text-gold" />
              <span className="font-medium text-app-text">Fio da Escritura</span>
              <span className="text-gold/60">•</span>
              <span>{chapterRef}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conteúdo Rolável */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* Categoria do Fio */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-gold/15 text-gold font-medium border border-gold/40">
                  {categoryMeta.label}
                </span>
                <span className="text-app-text-muted">
                  Confiança do modelo: {Math.round(result.confidence * 100)}%
                </span>
              </div>

              <h2 className="text-xl font-serif font-bold text-app-text tracking-tight pt-1">
                Uma linha de continuidade bíblica
              </h2>
              <p className="text-xs text-app-text-muted leading-relaxed">
                {categoryMeta.description}. O sistema analisou silenciosamente o capítulo em leitura
                e detectou correspondência temática e espiritual com sua caminhada no Memorial.
              </p>
            </div>

            {/* Nota Candidata */}
            {candidateNote ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs text-app-text-muted">
                  <Info className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span className="font-medium text-app-text">Nota sugerida do seu Memorial:</span>
                </div>

                <div className="rounded-2xl border border-border/80 bg-app-raised/60 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-app-text-muted font-serif">
                    <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold font-medium border border-gold/25">
                      {typeLabels[candidateNote.type] || "Memória"}
                    </span>
                    <span>{formatDate(candidateNote.createdAt)}</span>
                  </div>

                  {candidateNote.title && (
                    <h3 className="text-base font-serif font-semibold text-app-text">
                      {candidateNote.title}
                    </h3>
                  )}

                  {/* Referência da Nota */}
                  <div className="flex items-center gap-1.5 text-xs font-serif text-gold">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>
                      {candidateNote.bookName} {candidateNote.chapter}
                      {candidateNote.verse ? `:${candidateNote.verse}` : ""}
                    </span>
                  </div>

                  {/* Trecho do Conteúdo Escrito pelo Leitor */}
                  <p className="text-sm font-serif text-app-text leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {candidateNote.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-app-raised/40 p-4 text-xs text-app-text-muted font-serif italic text-center">
                Conexão identificada entre o texto de {chapterRef} e os temas registrados em suas orações e reflexões anteriores.
              </div>
            )}

            {/* Aviso de Transparência */}
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-3.5 text-[11px] text-app-text-muted leading-relaxed">
              <p className="text-app-text font-medium">Princípio do Silêncio e Autenticidade</p>
              <p className="mt-0.5">
                Nenhum texto exibido aqui é gerado por inteligência artificial. O Fio da Escritura
                apenas ilumina o elo entre as Escrituras Sagradas e as suas próprias palavras registradas.
              </p>
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border/70 bg-app-raised/80">
            {candidateNote ? (
              <Link
                to={`/memorial/${candidateNote.id}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full border border-gold/70 bg-gold/15 px-5 py-2 text-xs font-medium text-gold hover:bg-gold/25 transition-all shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Abrir Registro no Meu Memorial</span>
              </Link>
            ) : (
              <Link
                to="/memorial"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full border border-gold/70 bg-gold/15 px-5 py-2 text-xs font-medium text-gold hover:bg-gold/25 transition-all shadow-xs"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Ir para o Meu Memorial</span>
              </Link>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
