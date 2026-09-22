// ─────────────────────────────────────────────────────────────────────────────
// HymnCreditsModal.tsx — Bíblia Vive
//
// Modal inline de edição de créditos de gravação de um hino da Harpa Cristã.
// Visível apenas para admins. Salva via useHymnCredits → Supabase app_config.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Mic, X, Save, Loader2, Check, AlertCircle } from "lucide-react";
import { HymnCredits, useHymnCredits } from "@/hooks/useHymnCredits";

interface HymnCreditsModalProps {
  hymnNumber: number;
  hymnTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function HymnCreditsModal({
  hymnNumber,
  hymnTitle,
  open,
  onClose,
}: HymnCreditsModalProps) {
  const { credits, saveCredits, isSaving, saveError } = useHymnCredits(hymnNumber);

  const [form, setForm] = useState<HymnCredits>({ voice: "", source: "", notes: "" });
  const [saved, setSaved] = useState(false);

  // Sincroniza o formulário quando os créditos atuais carregam
  useEffect(() => {
    if (open) {
      setForm({
        voice: credits?.voice ?? "",
        source: credits?.source ?? "",
        notes: credits?.notes ?? "",
        sourceUrl: credits?.sourceUrl ?? "",
      });
      setSaved(false);
    }
  }, [open, credits]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    try {
      await saveCredits(form);
      setSaved(true);
      // Fecha o modal após 1.2s para o admin ver o feedback
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch {
      // saveError é exposto pelo hook
    }
  }

  function handleField(key: keyof HymnCredits, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Editar créditos — Hino ${hymnNumber}`}
    >
      {/* Painel */}
      <div className="w-full max-w-md rounded-2xl border border-[#382f23]/80 bg-[#161412] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#382f23]/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2219] border border-[#382f23] text-[#e5b869]">
              <Mic className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-[#e5b869]">
                Admin · Créditos da Gravação
              </p>
              <p className="text-xs text-[#a89b8c] truncate max-w-[240px]">
                Hino {hymnNumber} — {hymnTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6e6355] hover:text-[#f4efea] transition-colors p-1"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* Intérprete */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-voice"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Intérprete / Voz
            </label>
            <input
              id="credits-voice"
              type="text"
              value={form.voice ?? ""}
              onChange={(e) => handleField("voice", e.target.value)}
              placeholder="Ex: Coral Luz da Vida"
              className="w-full rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
          </div>

          {/* Fonte */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-source"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Fonte / Origem
            </label>
            <input
              id="credits-source"
              type="text"
              value={form.source ?? ""}
              onChange={(e) => handleField("source", e.target.value)}
              placeholder="Ex: CD Harpa Cristã Vol. 3"
              className="w-full rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
          </div>

          {/* Link da Fonte */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-source-url"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Link da Fonte
            </label>
            <input
              id="credits-source-url"
              type="url"
              value={form.sourceUrl ?? ""}
              onChange={(e) => handleField("sourceUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
            <p className="text-[0.62rem] text-[#6e6355]">
              Aparece como "Ouvir gravação original" com link externo
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label
              htmlFor="credits-notes"
              className="block font-mono text-[0.68rem] tracking-wider uppercase text-[#a89b8c]"
            >
              Observações
            </label>
            <textarea
              id="credits-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => handleField("notes", e.target.value)}
              placeholder="Notas editoriais, contexto da gravação..."
              className="w-full resize-none rounded-lg border border-[#382f23]/80 bg-[#1e1a15] px-3.5 py-2.5 text-sm text-[#f4efea] placeholder:text-[#6e6355] focus:border-[#e5b869]/60 focus:outline-none focus:ring-1 focus:ring-[#e5b869]/20 transition-all"
            />
          </div>

          {/* Feedback de erro */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-[#8f8272] hover:text-[#f4efea] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || saved}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-medium transition-all ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-[#e5b869] text-[#121110] hover:bg-[#d4a758] disabled:opacity-60 disabled:cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : saved ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Salvar créditos
                </>
              )}
            </button>
          </div>
        </form>

        {/* Rodapé informativo */}
        <div className="border-t border-[#382f23]/40 px-5 py-3">
          <p className="text-[0.65rem] text-[#6e6355]">
            Salvo no Supabase · Cache público de 5 min · Visível a todos os leitores
          </p>
        </div>
      </div>
    </div>
  );
}
