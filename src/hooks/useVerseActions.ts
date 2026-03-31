import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/useToast";

interface VersePayload {
  chapter: number;
  pathname: string;
  reference: string;
  text: string;
  verseNumber: string;
  version: string;
}

type CopyState = "idle" | "copied";
type ShareState = "idle" | "shared" | "link-copied";

const copyWithExecCommand = (value: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  return success;
};

const formatVerseText = (payload: VersePayload) => `"${payload.text}" — ${payload.reference} (${payload.version.toUpperCase()})`;

export function useVerseActions() {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [shareState, setShareState] = useState<ShareState>("idle");

  useEffect(() => {
    if (copyState !== "copied") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  useEffect(() => {
    if (shareState === "idle") return;
    const timer = window.setTimeout(() => setShareState("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [shareState]);

  const copyVerse = useCallback(async (payload: VersePayload) => {
    const formatted = formatVerseText(payload);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formatted);
      } else {
        copyWithExecCommand(formatted);
      }
      setCopyState("copied");
      toast({ message: "✓ Versículo copiado", type: "success" });
      return true;
    } catch {
      const fallback = copyWithExecCommand(formatted);
      if (fallback) {
        setCopyState("copied");
        toast({ message: "✓ Versículo copiado", type: "success" });
      }
      return fallback;
    }
  }, []);

  const shareVerse = useCallback(async (payload: VersePayload) => {
    const formatted = formatVerseText(payload);
    const url = `${window.location.origin}${payload.pathname}#v${payload.verseNumber}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Bíblia Vive", text: formatted, url });
        setShareState("shared");
        toast({ message: "✓ Link copiado", type: "success" });
        return "shared" as const;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        copyWithExecCommand(url);
      }
      setShareState("link-copied");
      toast({ message: "✓ Link copiado", type: "success" });
      return "link-copied" as const;
    } catch {
      return null;
    }
  }, []);

  return {
    copyState,
    copyVerse,
    formatVerseText,
    shareState,
    shareVerse,
  };
}

export type { VersePayload, CopyState, ShareState };