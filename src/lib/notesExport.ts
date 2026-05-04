// ─────────────────────────────────────────────────────────────────────────────
// notesExport.ts — Bíblia Vive
//
// Exportação de Notas para TXT e PDF (ADR-0005).
// Separado de noteStore.ts para não carregar jsPDF no bundle principal.
// ─────────────────────────────────────────────────────────────────────────────

import type { VerseNote } from "./noteStore";

export function exportNotesToTXT(notes: VerseNote[]): void {
    const lines = notes.map(n =>
        `${n.bookName} ${n.chapter}:${n.verse}\n"${n.verseText}"\n\n${n.content}\n\n---\n`
    );
    const blob = new Blob(
        [`BÍBLIA VIVE — MINHAS NOTAS\n${"=".repeat(40)}\n\n`, ...lines],
        { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minhas-notas-biblia-vive.txt";
    a.click();
    URL.revokeObjectURL(url);
}

export async function exportNotesToPDF(notes: VerseNote[], isSingleChapter = false): Promise<void> {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const centerText = (text: string, currentY: number) => {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, currentY);
    };

    // Cover
    doc.setFillColor(252, 251, 248);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setTextColor(40, 40, 40);
    doc.setFont("times", "normal");

    y = 40;
    doc.setFontSize(16);
    centerText("BÍBLIA VIVE", y);
    y += 15;

    doc.setFont("times", "italic");
    doc.setFontSize(28);
    doc.setTextColor(190, 160, 100);
    centerText(isSingleChapter && notes.length > 0 ? `Anotações: ${notes[0].bookName} ${notes[0].chapter}` : "Minhas Anotações", y);

    y += 20;
    doc.setDrawColor(210, 190, 140);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 20, y, pageWidth / 2 + 20, y);
    y += 15;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    centerText(`Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`, y);
    y += 30;

    // Body
    for (const note of notes) {
        if (y > pageHeight - 40) {
            doc.addPage();
            doc.setFillColor(252, 251, 248);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            y = margin + 10;
        }

        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(`${note.bookName} ${note.chapter}:${note.verse}`, margin, y);
        y += 6;

        if (note.verseText) {
            doc.setFont("times", "italic");
            doc.setFontSize(11);
            doc.setTextColor(120, 120, 120);
            const wrappedVerse = doc.splitTextToSize(`"${note.verseText}"`, contentWidth - 10);
            doc.setDrawColor(220, 210, 190);
            doc.setLineWidth(1);
            doc.line(margin, y - 4, margin, y + wrappedVerse.length * 5 - 2);
            doc.text(wrappedVerse, margin + 4, y);
            y += wrappedVerse.length * 6 + 4;
        } else {
            y += 2;
        }

        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        const noteLines = doc.splitTextToSize(note.content, contentWidth);

        if (y + noteLines.length * 6 > pageHeight - margin) {
            doc.addPage();
            doc.setFillColor(252, 251, 248);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            y = margin + 10;
        }

        doc.text(noteLines, margin, y);
        y += noteLines.length * 6 + 12;

        doc.setDrawColor(240, 235, 225);
        doc.setLineWidth(0.5);
        doc.line(margin + 20, y, pageWidth - margin - 20, y);
        y += 10;
    }

    const filename = isSingleChapter && notes.length > 0
        ? `Anotacoes_${notes[0].bookName}_${notes[0].chapter}.pdf`
        : "Minhas_Anotacoes_Biblia_Viva.pdf";

    doc.save(filename.replace(/\s+/g, "_"));
}
