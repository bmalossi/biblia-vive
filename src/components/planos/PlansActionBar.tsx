import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanCategoryFilter } from "@/lib/readingPlanTypes";

export interface PlansActionBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: PlanCategoryFilter;
  onCategoryChange: (category: PlanCategoryFilter) => void;
  totalFiltered?: number;
  className?: string;
}

const CATEGORIES: Array<{ id: PlanCategoryFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "featured", label: "Em destaque" },
  { id: "thematic", label: "Temáticos" },
  { id: "books", label: "Livros" },
  { id: "seasonal", label: "Sazonais" },
];

export default function PlansActionBar({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  className,
}: PlansActionBarProps) {
  return (
    <section
      aria-label="Barra de busca e filtros de planos de leitura"
      className={cn("space-y-4 mb-8", className)}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 w-full">
        {/* Campo de Busca em Pílula */}
        <div className="relative flex-1 w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 sm:left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por plano, livro, tema ou palavra..."
            aria-label="Buscar planos de leitura"
            className="h-11 w-full rounded-full border border-border/80 bg-app-surface pl-11 sm:pl-12 pr-10 text-xs sm:text-sm text-app-text placeholder:text-app-text-muted/60 shadow-inner focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpar busca"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Pílulas de Filtro por Categoria */}
        <div
          role="tablist"
          aria-label="Filtrar planos por categoria"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  "px-4 sm:px-5 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 shrink-0 select-none",
                  isActive
                    ? "bg-gold text-primary-foreground font-semibold shadow-md active:scale-95"
                    : "bg-app-surface border border-border text-app-text-muted hover:text-app-text hover:border-gold/40 hover:bg-app-raised"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
