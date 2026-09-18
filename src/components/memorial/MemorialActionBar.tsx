import React from "react";
import { Search, Plus, X, ArrowUpDown, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialFilterType } from "@/components/memorial/MemorialHeader";

export interface MemorialActionBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: MemorialFilterType;
  onFilterChange: (filter: MemorialFilterType) => void;
  sortOrder: "recent" | "oldest";
  onToggleSortOrder: () => void;
  onNewEntry: () => void;
  onExportTXT: () => void;
  onExportPDF: () => void;
  isPro: boolean;
  totalFiltered: number;
  className?: string;
}

const FILTER_TABS: { id: MemorialFilterType; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "reflection", label: "Reflexões" },
  { id: "prayer", label: "Orações" },
  { id: "testimony", label: "Testemunhos" },
  { id: "fasting", label: "Propósitos" },
  { id: "answered", label: "Respostas" },
  { id: "favorite", label: "Favoritos" },
];

export default function MemorialActionBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortOrder,
  onToggleSortOrder,
  onNewEntry,
  onExportTXT,
  onExportPDF,
  isPro,
  totalFiltered,
  className,
}: MemorialActionBarProps) {
  return (
    <section
      aria-label="Barra de busca e filtros do Memorial"
      className={cn("space-y-4 mb-8", className)}
    >
      {/* Linha Superior: Busca Universal e Botão '+ Nova memória' */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        {/* Campo de Busca em Pílula Arredondada */}
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-4 sm:left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8272]" />
          <input
            type="text"
            className="h-11 w-full rounded-full border border-[#382f23]/80 bg-[#161412] pl-11 sm:pl-12 pr-10 text-xs sm:text-sm text-[#f4efea] placeholder:text-[#6e6355] shadow-inner focus:outline-none focus:border-[#e5b869] focus:ring-1 focus:ring-[#e5b869]/30 transition-all"
            placeholder="Buscar por texto, título, livro, capítulo ou tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar por texto, título, livro, capítulo ou tags"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8f8272] hover:text-[#f4efea] transition-colors p-1 cursor-pointer"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Botão Primário '+ Nova memória' */}
        <button
          type="button"
          onClick={onNewEntry}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#e5b869] hover:bg-[#d8a855] text-[#161412] px-6 text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova memória</span>
        </button>
      </div>

      {/* Linha Inferior: Abas de Filtragem e Controles de Ordenação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        {/* Abas / Pills de Filtro */}
        <div
          role="tablist"
          aria-label="Filtros de categorias do Memorial"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none"
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
                  "shrink-0 px-4 py-1.5 rounded-full text-xs font-sans transition-all duration-200 border cursor-pointer select-none",
                  isActive
                    ? "bg-[#e5b869] text-[#161412] font-semibold border-[#e5b869] shadow-sm"
                    : "bg-[#161412] text-[#8f8272] border-[#382f23]/80 hover:text-[#f4efea] hover:border-[#c69a50]/40"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Controles de Ordenação e Exportação */}
        <div className="flex items-center gap-2 ml-auto shrink-0 text-xs">
          {/* Ordenação por Data */}
          <button
            type="button"
            onClick={onToggleSortOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#382f23]/80 bg-[#161412] text-[#8f8272] hover:text-[#f4efea] hover:border-[#c69a50]/40 transition-colors cursor-pointer select-none"
            title="Alternar ordem cronológica"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#c69a50]" />
            <span>{sortOrder === "recent" ? "Mais recentes ▾" : "Mais antigos ▾"}</span>
          </button>

          {/* Exportação TXT */}
          <button
            type="button"
            onClick={onExportTXT}
            disabled={totalFiltered === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#382f23]/80 bg-[#161412] text-[#8f8272] hover:text-[#f4efea] hover:border-[#c69a50]/40 disabled:opacity-40 transition-colors cursor-pointer"
            title="Exportar memórias para TXT"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TXT</span>
          </button>

          {/* Exportação PDF */}
          <button
            type="button"
            onClick={onExportPDF}
            disabled={totalFiltered === 0}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer disabled:opacity-40",
              isPro
                ? "border-[#c69a50]/40 bg-[#c69a50]/10 text-[#e5b869] hover:bg-[#c69a50]/20"
                : "border-[#382f23]/80 bg-[#161412] text-[#8f8272] hover:text-[#f4efea] hover:border-[#c69a50]/40"
            )}
            title={isPro ? "Exportar para PDF" : "Recurso Pro — Exportar PDF"}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>
    </section>
  );
}
