// ─────────────────────────────────────────────────────────────────────────────
// MemorialFAB.tsx — Bíblia Vive · Sprint 26
//
// Floating Action Button expansível para o Meu Memorial.
// Permite ao leitor registrar Reflexões, Orações, Testemunhos e Jejuns/Propósitos
// em menos de 15 segundos sem sair do capítulo bíblico.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { Plus, X, BookOpen, Heart, Sparkles, Mountain, Scroll } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialCategory } from "@/lib/noteStore";

interface MemorialFABProps {
    entriesCount: number;
    onSelectCategory: (category: MemorialCategory) => void;
    onOpenMemorialList: () => void;
    isFocusMode?: boolean;
}

export default function MemorialFAB({
    entriesCount,
    onSelectCategory,
    onOpenMemorialList,
    isFocusMode = false,
}: MemorialFABProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fechar o menu expansível ao clicar fora
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        }
        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isExpanded]);

    const categories: {
        id: MemorialCategory;
        label: string;
        icon: typeof BookOpen;
        colorClasses: string;
    }[] = [
        {
            id: 'reflection',
            label: 'Reflexão',
            icon: BookOpen,
            colorClasses: 'bg-app-surface text-gold border-gold/40 hover:bg-gold hover:text-black',
        },
        {
            id: 'prayer',
            label: 'Oração',
            icon: Heart,
            colorClasses: 'bg-app-surface text-blue-400 border-blue-500/40 hover:bg-blue-600 hover:text-white',
        },
        {
            id: 'testimony',
            label: 'Testemunho',
            icon: Sparkles,
            colorClasses: 'bg-app-surface text-emerald-400 border-emerald-500/40 hover:bg-emerald-600 hover:text-white',
        },
        {
            id: 'fasting',
            label: 'Jejum / Propósito',
            icon: Mountain,
            colorClasses: 'bg-app-surface text-slate-300 border-slate-500/40 hover:bg-slate-600 hover:text-white',
        },
    ];

    function handleCategoryClick(cat: MemorialCategory) {
        setIsExpanded(false);
        onSelectCategory(cat);
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "fixed left-4 z-40 flex flex-col items-start gap-2.5",
                isFocusMode ? "bottom-6" : "bottom-20 md:bottom-6",
                "md:left-6 md:bottom-6"
            )}
        >
            {/* Opções Expansíveis (Speed Dial Vertical) */}
            {isExpanded && (
                <div
                    className="flex flex-col items-start gap-2 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200"
                    role="menu"
                    aria-orientation="vertical"
                >
                    {/* Botão para ver registros do capítulo / Meu Memorial */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsExpanded(false);
                            onOpenMemorialList();
                        }}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-border bg-app-surface text-app-text-muted hover:text-app-text hover:border-gold/40 text-[0.8rem] font-sans shadow-md backdrop-blur-md transition-all duration-200"
                    >
                        <Scroll className="h-4 w-4 text-gold shrink-0" />
                        <span>Ver marcas do capítulo ({entriesCount})</span>
                    </button>

                    {/* Botões das 4 Categorias */}
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.id)}
                                className={cn(
                                    "flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-lg text-[0.82rem] font-sans font-medium backdrop-blur-md transition-all duration-200 active:scale-95",
                                    cat.colorClasses
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Botão Principal do FAB */}
            <button
                id="memorial-fab-btn"
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Fechar menu do Memorial" : "Abrir menu do Memorial"}
                title="Meu Memorial da Caminhada"
                className={cn(
                    "relative flex h-13 w-13 items-center justify-center rounded-full shadow-xl transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-gold/50 hover:scale-105 active:scale-95",
                    isExpanded
                        ? "bg-app-raised border-border text-app-text"
                        : "bg-gold border-gold text-black hover:bg-gold/90"
                )}
            >
                {isExpanded ? (
                    <X className="h-6 w-6 transition-transform duration-200 rotate-90" />
                ) : (
                    <Plus className="h-6 w-6 transition-transform duration-200" />
                )}

                {/* Badge de contagem de registros no capítulo */}
                {!isExpanded && entriesCount > 0 && (
                    <span
                        aria-hidden="true"
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[0.68rem] font-bold text-gold border border-gold shadow-sm animate-in zoom-in-50"
                    >
                        {entriesCount}
                    </span>
                )}
            </button>
        </div>
    );
}
