import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import VoiceRecordButton from "@/components/VoiceRecordButton";
import QuickVoiceMemorial from "@/components/QuickVoiceMemorial";
import { BrowserRouter } from "react-router-dom";

// Controle dinamico do mock de useAuth
let mockUser: { id: string; email: string } | null = null;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: !!mockUser,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    isPending: false,
  }),
}));

// Mock do i18n
vi.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Voice Recording Authentication Gate", () => {
  beforeEach(() => {
    mockUser = null;
    vi.clearAllMocks();
  });

  it("VoiceRecordButton: abre AuthModal ao tentar gravar deslogado", () => {
    mockUser = null;
    const onTranscript = vi.fn();

    render(
      <VoiceRecordButton
        onTranscript={onTranscript}
        label="Ditar por voz"
        size="md"
      />
    );

    const button = screen.getByRole("button", { name: /ditar por voz/i });
    fireEvent.click(button);

    // O modal de autenticacao deve ser exibido com seu hint
    expect(screen.getByText(/Faça login para registrar anotações por voz/i)).toBeInTheDocument();
  });

  it("QuickVoiceMemorial: abre AuthModal ao tentar iniciar gravacao deslogado", () => {
    mockUser = null;

    render(
      <BrowserRouter>
        <QuickVoiceMemorial isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const startBtn = screen.getByRole("button", { name: /começar a gravar/i });
    fireEvent.click(startBtn);

    // O modal de autenticacao deve ser exibido com o hint especifico
    expect(screen.getByText(/Faça login ou crie sua conta para gravar sua reflexão por voz no Memorial/i)).toBeInTheDocument();
  });
});
