import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import MemorialEntryModal from "@/components/MemorialEntryModal";
import { createNoteStore, type MemorialEntry } from "@/lib/noteStore";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-1", email: "user@test.com" },
    isAuthenticated: true,
  }),
}));

describe("MemorialEntryModal - Edição e Salvamento", () => {
  const existingReflection: MemorialEntry = {
    id: "entry-123",
    type: "reflection",
    title: "Minha Primeira Reflexão",
    content: "Texto original da reflexão gravado anteriormente",
    bookId: "sl",
    bookName: "Salmos",
    chapter: 23,
    verse: 1,
    version: "acf",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
    metadata: {
      soap: {
        observation: "Texto original da reflexão gravado anteriormente",
      },
    },
  };

  it("atualiza compiledContent com a nova observação ao editar marco e clicar em Guardar Memória", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <MemorialEntryModal
        isOpen={true}
        onClose={vi.fn()}
        category="reflection"
        bookId="sl"
        bookName="Salmos"
        chapter={23}
        version="acf"
        existingEntry={existingReflection}
        onSave={onSave}
      />
    );

    // Encontra o campo de Observação (O)
    const observationTextarea = screen.getByPlaceholderText(/O que chamou sua atenção no versículo/i);
    expect(observationTextarea).toHaveValue("Texto original da reflexão gravado anteriormente");

    // Simula o usuário adicionando transcrições de voz adicionais no campo Observação
    fireEvent.change(observationTextarea, {
      target: {
        value: "Texto original da reflexão gravado anteriormente + transcrição adicional 1 + transcrição adicional 2",
      },
    });

    // Clica no botão Guardar Memória
    const saveButton = screen.getByRole("button", { name: /guardar memória/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    const savedPayload = onSave.mock.calls[0][0];
    expect(savedPayload.id).toBe("entry-123");
    expect(savedPayload.metadata.soap.observation).toContain("transcrição adicional 1");
    // O conteúdo compilado deve conter o novo texto atualizado, NÃO o texto antigo!
    expect(savedPayload.content).toContain("transcrição adicional 1");
    expect(savedPayload.content).toContain("transcrição adicional 2");
  });

  it("garante que store.update e store.create delegam corretamente para save", async () => {
    const store = createNoteStore(null);
    const saveSpy = vi.spyOn(store, "save").mockResolvedValue(undefined);

    await store.update!("entry-123", { content: "Atualizado" } as any);
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: "entry-123", content: "Atualizado" }));

    await store.create!({ content: "Novo", type: "reflection", bookId: "sl", bookName: "Salmos", chapter: 23, version: "acf" } as any);
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ content: "Novo" }));
  });
});
