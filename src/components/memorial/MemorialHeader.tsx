import React from "react";
import { Search, Plus, FileText, Download, Scroll } from "lucide-react";
import { cn } from "@/lib/utils";
import { MemorialStoneStack } from "@/components/memorial/MemorialStoneStack";

export type MemorialFilterType =
  | "all"
  | "reflection"
  | "prayer"
  | "testimony"
  | "fasting"
  | "answered"
  | "favorite";

export interface MemorialHeaderProps {
  totalEntries: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeFilter: MemorialFilterType;
  onFilterChange: (filter: MemorialFilterType) => void;
  onNewEntry: () => void;
  onExportTXT: () => void;
  onExportPDF: () => void;
  isPro: boolean;
}

const FILTER_TABS: { id: MemorialFilterType; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "reflection", label: "Reflexões" },
  { id: "prayer", label: "Orações" },
  { id: "testimony", label: "Testemunhos" },
  { id: "fasting", label: "Propósitos" },
  { id: "answered", label: "Respondidas" },
  { id: "favorite", label: "Favoritos" },
];

export const MemorialHeader: React.FC<MemorialHeaderProps> = ({
  totalEntries,
  filteredCount,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onNewEntry,
  onExportTXT,
  onExportPDF,
  isPro,
}) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Altar de Pedras de Ebenézer — Preserva 1 Samuel 7:12 e contagem serena */}
      <MemorialStoneStack totalEntries={totalEntries} />

      {/* Barra de Ação Superior e Busca */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Busca Universal */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-text-muted/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por texto, título, livro, capítulo ou tags..."
              aria-label="Buscar marcos de fé"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-app-surface text-[0.85rem] text-app-text placeholder:text-app-text-muted/50 focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-xs transition-colors"
            />
          </div>

          {/* Botão Primário: Novo Marco de Fé */}
          <button
            type="button"
            onClick={onNewEntry}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gold text-black font-semibold text-xs hover:bg-gold/90 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Novo marco de fé</span>
          </button>
        </div>

        {/* Abas/Pills de Filtragem — Sem Contadores de Cobrança por Categoria */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div
            role="tablist"
            aria-label="Filtros de marcos espirituais"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => onFilterChange(tab.id)}
                  className={cn(
                    "shrink-0 px-3.5 py-1.5 rounded-full text-[0.78rem] font-sans transition-all duration-200 border cursor-pointer",
                    isActive
                      ? "bg-gold text-black border-gold font-medium shadow-xs"
                      : "bg-app-surface text-app-text-muted border-border hover:border-gold/30 hover:text-app-text"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Ações de Exportação */}
          <div className="flex items-center gap-2 ml-auto text-[0.75rem]">
            <button
              type="button"
              onClick={onExportTXT}
              disabled={filteredCount === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-app-surface text-app-text-muted hover:text-app-text hover:border-gold/40 disabled:opacity-40 transition-colors cursor-pointer"
              title="Exportar para TXT"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>TXT</span>
            </button>
            <button
              type="button"
              onClick={onExportPDF}
              disabled={filteredCount === 0}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer disabled:opacity-40",
                isPro
                  ? "border-gold/30 bg-gold/5 text-gold hover:bg-gold/10"
                  : "border-border bg-app-surface text-app-text-muted hover:border-gold/40"
              )}
              title={isPro ? "Exportar para PDF" : "Recurso Pro — Exportar PDF"}
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorialHeader;
