import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, BookOpen, Check } from "lucide-react";
import { ALL_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT, Book } from "@/lib/books";
import { useReadingTheme } from "@/hooks/useReadingTheme";
import { cn } from "@/lib/utils";

export interface BookPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBookSlug?: string;
  onSelectBook: (bookSlug: string) => void;
}

type FilterTab = "all" | "ot" | "nt";

/**
 * BookPickerModal
 *
 * Modal responsivo para escolha de livros da Bíblia com:
 * - Campo de busca rápida com filtro normalizado (sem acentos)
 * - Abas para Todos (66), Antigo Testamento (39) e Novo Testamento (27)
 * - Destaque no livro atualmente lido
 * - Adaptável aos temas Dark, Sépia e Light
 */
export const BookPickerModal: React.FC<BookPickerModalProps> = ({
  open,
  onOpenChange,
  currentBookSlug,
  onSelectBook,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const { isDark, isSepia } = useReadingTheme();

  const filteredBooks = useMemo(() => {
    let list: Book[] = ALL_BOOKS;
    if (activeTab === "ot") list = OLD_TESTAMENT;
    if (activeTab === "nt") list = NEW_TESTAMENT;

    if (!searchTerm.trim()) return list;

    const term = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return list.filter((b) => {
      const nameNorm = b.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const abbrevNorm = b.abbrev
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return nameNorm.includes(term) || abbrevNorm.includes(term);
    });
  }, [activeTab, searchTerm]);

  const handleSelect = (slug: string) => {
    onSelectBook(slug);
    onOpenChange(false);
  };

  // Theme styles
  const dialogContentClass = isDark
    ? "border-[#382f23]/80 bg-[#161412] text-[#f5f5f0]"
    : isSepia
      ? "border-[#d8c8b0] bg-[#f6f0e4] text-[#2e241d]"
      : "border-neutral-200 bg-white text-neutral-900";

  const searchInputClass = isDark
    ? "border-[#382f23]/70 bg-[#1c1916] text-[#f5f5f0] placeholder-[#a89f91]/60"
    : isSepia
      ? "border-[#d8c8b0] bg-[#ede4d4] text-[#2e241d] placeholder-[#8a7767]"
      : "border-neutral-300 bg-neutral-50 text-neutral-900 placeholder-neutral-400";

  const activeTabClass = isDark
    ? "bg-[#e5b869] text-neutral-950 font-semibold"
    : isSepia
      ? "bg-[#c4973b] text-[#1c140e] font-semibold"
      : "bg-[#d4a034] text-neutral-950 font-semibold";

  const inactiveTabClass = isDark
    ? "bg-[#221e1a] text-[#a89f91] hover:text-[#f5f5f0] border-[#382f23]/50"
    : isSepia
      ? "bg-[#ede4d4] text-[#7d6c5d] hover:text-[#2e241d] border-[#d8c8b0]"
      : "bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200";

  const activeBookClass = isDark
    ? "bg-[#e5b869]/15 border-[#e5b869] text-[#e5b869] font-bold shadow-xs"
    : isSepia
      ? "bg-[#c4973b]/20 border-[#c4973b] text-[#8a5d12] font-bold shadow-xs"
      : "bg-amber-50 border-amber-500 text-amber-800 font-bold shadow-xs";

  const inactiveBookClass = isDark
    ? "bg-[#1f1b18]/70 hover:bg-[#28231f] border-[#382f23]/40 text-[#ded9ce] hover:text-white hover:border-[#382f23]"
    : isSepia
      ? "bg-[#ede4d4]/60 hover:bg-[#ede4d4] border-[#d8c8b0] text-[#4a3a2d] hover:text-[#1c140e]"
      : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800 hover:text-neutral-950";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl border sm:rounded-2xl p-6 shadow-2xl transition-colors duration-300", dialogContentClass)}>
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            <DialogTitle className="text-xl font-serif">
              Livros da Bíblia
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecione um livro do Antigo ou Novo Testamento para iniciar a leitura.
          </DialogDescription>
        </DialogHeader>

        {/* Search & Tabs Filter */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar livro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:border-gold focus:outline-none transition-colors", searchInputClass)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer border",
                activeTab === "all" ? activeTabClass : inactiveTabClass
              )}
            >
              Todos (66)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ot")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer border",
                activeTab === "ot" ? activeTabClass : inactiveTabClass
              )}
            >
              Antigo Testamento (39)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("nt")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer border",
                activeTab === "nt" ? activeTabClass : inactiveTabClass
              )}
            >
              Novo Testamento (27)
            </button>
          </div>
        </div>

        {/* Books Grid */}
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-1 pt-2">
          {filteredBooks.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum livro encontrado para "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredBooks.map((b) => {
                const isCurrent = b.slug.toLowerCase() === currentBookSlug?.toLowerCase();
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelect(b.slug)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border",
                      isCurrent ? activeBookClass : inactiveBookClass
                    )}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="text-[0.65rem] text-muted-foreground font-mono ml-1 shrink-0">
                      {b.chapters} cap
                    </span>
                    {isCurrent && <Check className="h-3.5 w-3.5 text-gold shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookPickerModal;
