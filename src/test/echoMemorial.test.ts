import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { selectBestEcho, LocalNoteStore, type MemorialEntry } from "@/lib/noteStore";

describe("Motor de Memórias (selectBestEcho)", () => {
    const baseEntry: MemorialEntry = {
        id: "1",
        type: "reflection",
        title: "Meditação em João 15",
        content: "Eu sou a videira verdadeira...",
        bookId: "joao",
        bookName: "João",
        chapter: 15,
        verse: 1,
        version: "acf",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    it("retorna null se a lista estiver vazia", () => {
        const result = selectBestEcho([]);
        expect(result).toBeNull();
    });

    it("prioriza o contexto de leitura atual se houver registro no capítulo", () => {
        const entries: MemorialEntry[] = [
            {
                ...baseEntry,
                id: "other-book",
                bookId: "salmos",
                chapter: 23,
                type: "prayer",
                createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                ...baseEntry,
                id: "current-book",
                bookId: "joao",
                chapter: 15,
                type: "reflection",
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ];

        const result = selectBestEcho(entries, "joao", 15);
        expect(result).not.toBeNull();
        expect(result?.id).toBe("current-book");
    });

    it("aplica o critério de desempate por tipo (Oração não respondida > Testemunho > Reflexão > Propósito)", () => {
        const entries: MemorialEntry[] = [
            { ...baseEntry, id: "reflection-1", type: "reflection" },
            { ...baseEntry, id: "fasting-1", type: "fasting" },
            { ...baseEntry, id: "testimony-1", type: "testimony" },
            { ...baseEntry, id: "prayer-unanswered", type: "prayer", status: "pending" },
            { ...baseEntry, id: "prayer-answered", type: "prayer", status: "answered" },
        ];

        const result = selectBestEcho(entries, "joao", 15);
        expect(result).not.toBeNull();
        expect(result?.id).toBe("prayer-unanswered");
    });

    it("desconsidera registros ecoados há menos de 7 dias (trava anti-repetição)", () => {
        const entries: MemorialEntry[] = [
            {
                ...baseEntry,
                id: "recently-echoed",
                lastEchoAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
            },
            {
                ...baseEntry,
                id: "old-echoed",
                lastEchoAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias atrás
            },
        ];

        const result = selectBestEcho(entries);
        expect(result).not.toBeNull();
        expect(result?.id).toBe("old-echoed");
    });

    it("retorna null se todos os registros foram ecoados nos últimos 7 dias", () => {
        const entries: MemorialEntry[] = [
            {
                ...baseEntry,
                id: "recently-echoed-1",
                lastEchoAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ];

        const result = selectBestEcho(entries);
        expect(result).toBeNull();
    });

    it("LocalNoteStore executa getMatchingEcho com sucesso", async () => {
        const store = new LocalNoteStore();
        await store.save({
            type: "prayer",
            title: "Pedido de sabedoria",
            content: "Senhor guia meus passos",
            bookId: "proverbios",
            bookName: "Provérbios",
            chapter: 3,
            version: "acf",
        });

        const echo = await store.getMatchingEcho("proverbios", 3);
        expect(echo).not.toBeNull();
        expect(echo?.bookId).toBe("proverbios");
        expect(echo?.chapter).toBe(3);
    });

    it("LocalNoteStore anexa atualizações em metadata.eco_updates sem sobrescrever histórico", async () => {
        const store = new LocalNoteStore();
        await store.save({
            id: "eco-update-test",
            type: "reflection",
            title: "Reflexão sobre Filipenses",
            content: "Posso todas as coisas naquele que me fortalece",
            bookId: "filipenses",
            bookName: "Filipenses",
            chapter: 4,
            version: "acf",
        });

        await store.addEcoUpdate("eco-update-test", "Primeira resposta de Deus 6 meses depois");
        await store.addEcoUpdate("eco-update-test", "Segunda confirmação 1 ano depois");

        const all = await store.getAll();
        const found = all.find((e) => e.id === "eco-update-test");
        expect(found).toBeDefined();
        expect(found?.metadata?.eco_updates).toHaveLength(2);
        expect(found?.metadata?.eco_updates[0].text).toBe("Primeira resposta de Deus 6 meses depois");
        expect(found?.metadata?.eco_updates[1].text).toBe("Segunda confirmação 1 ano depois");
    });
});
