// ─────────────────────────────────────────────────────────────────────────────
// useStudyData.ts — Bíblia Vive
//
// React hook para dados do painel de estudo.
// Extraído de lib/studyPanel.ts para hooks/ (ADR-candidato-4):
// lib/ é reservado para código sem dependências React.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { getStudyData, type StudyData } from "@/lib/studyPanel";

export function useStudyData(
    bookId: string,
    chapter: number,
    verse: number | null,
    version: string
) {
    const [data, setData] = useState<StudyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!verse) {
            setData(null);
            return;
        }
        setLoading(true);
        setError(null);
        getStudyData(bookId, chapter, verse, version)
            .then(setData)
            .catch(() => setError("Não foi possível carregar os dados de estudo."))
            .finally(() => setLoading(false));
    }, [bookId, chapter, verse, version]);

    return { data, loading, error };
}
