// ─────────────────────────────────────────────────────────────────────────────
// notebookExport.ts — Bíblia Vive
//
// Funções auxiliares para exportar um ou mais cadernos para os formatos
// PDF (usando jsPDF) e Word (.doc compatível).
// ─────────────────────────────────────────────────────────────────────────────

import type { ChapterNotebook } from "./notebookStore";
import { findBookGlobally } from "./books";

/**
 * Exporta uma lista de cadernos para o formato PDF.
 */
export async function exportNotebooksToPDF(
    notebooks: ChapterNotebook[],
    titleLabel: string,
    filenamePrefix: string
): Promise<void> {
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

    // ── Capa do Documento ──
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
    
    // Divide o título se for muito grande
    const wrappedTitle = doc.splitTextToSize(titleLabel, contentWidth);
    for (const titleLine of wrappedTitle) {
        centerText(titleLine, y);
        y += 12;
    }
    y += 8;

    doc.setDrawColor(210, 190, 140);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 20, y, pageWidth / 2 + 20, y);
    y += 15;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    centerText(
        `Gerado em ${new Date().toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })}`,
        y
    );
    y += 30;

    // ── Corpo do Documento ──
    for (const notebook of notebooks) {
        if (y > pageHeight - 40) {
            doc.addPage();
            doc.setFillColor(252, 251, 248);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            y = margin + 10;
        }

        const bookName = findBookGlobally(notebook.bookId)?.name ?? notebook.bookId;
        const refText = `${bookName} ${notebook.chapter} (${notebook.version.toUpperCase()})`;

        // Cabeçalho do Caderno (Referência Bíblica)
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.setTextColor(190, 160, 100);
        doc.text(refText, margin, y);
        y += 8;

        // Título do caderno
        if (notebook.title) {
            doc.setFont("times", "bold");
            doc.setFontSize(12);
            doc.setTextColor(50, 50, 50);
            doc.text(notebook.title, margin, y);
            y += 6;
        }

        // Conteúdo do caderno
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);

        // Divide o texto por parágrafos para preservar a quebra de linha do usuário
        const paragraphs = notebook.content.split(/\r?\n/);
        for (const paragraph of paragraphs) {
            if (!paragraph.trim()) {
                y += 4;
                continue;
            }

            const pLines = doc.splitTextToSize(paragraph, contentWidth);
            if (y + pLines.length * 6 > pageHeight - margin - 10) {
                doc.addPage();
                doc.setFillColor(252, 251, 248);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
                y = margin + 10;
            }
            doc.text(pLines, margin, y);
            y += pLines.length * 6 + 2;
        }

        y += 8;
        doc.setDrawColor(240, 235, 225);
        doc.setLineWidth(0.5);
        doc.line(margin + 20, y, pageWidth - margin - 20, y);
        y += 12;
    }

    const filename = `${filenamePrefix.replace(/\s+/g, "_")}.pdf`;
    doc.save(filename);
}

/**
 * Exporta uma lista de cadernos para o formato Word (.doc compatível).
 */
export function exportNotebooksToWord(
    notebooks: ChapterNotebook[],
    titleLabel: string,
    filenamePrefix: string
): void {
    let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset="utf-8">
        <title>${titleLabel}</title>
        <style>
            body {
                font-family: 'Times New Roman', Times, serif;
                line-height: 1.6;
                color: #333333;
                margin: 40px;
            }
            h1 {
                font-size: 28pt;
                color: #BEA064;
                text-align: center;
                margin-bottom: 5px;
            }
            .subtitle {
                text-align: center;
                font-style: italic;
                color: #666666;
                font-size: 11pt;
                margin-bottom: 40px;
            }
            .divider {
                border-top: 1px solid #D2C28C;
                width: 100px;
                margin: 20px auto 40px auto;
            }
            .notebook-item {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .notebook-header {
                font-size: 16pt;
                font-weight: bold;
                color: #BEA064;
                margin-bottom: 5px;
                border-bottom: 1px double #E6E1D7;
                padding-bottom: 3px;
            }
            .notebook-title {
                font-size: 13pt;
                font-weight: bold;
                color: #333333;
                margin-top: 10px;
                margin-bottom: 10px;
            }
            .notebook-content {
                font-size: 11pt;
                margin: 0 0 8px 0;
                color: #222222;
            }
        </style>
    </head>
    <body>
        <h1>${titleLabel}</h1>
        <div class="subtitle">Bíblia Vive &middot; Gerado em ${new Date().toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })}</div>
        <div class="divider"></div>
    `;

    for (const notebook of notebooks) {
        const bookName = findBookGlobally(notebook.bookId)?.name ?? notebook.bookId;
        const refLabel = `${bookName} ${notebook.chapter} (${notebook.version.toUpperCase()})`;

        html += `
        <div class="notebook-item">
            <div class="notebook-header">${refLabel}</div>
        `;

        if (notebook.title) {
            html += `
            <div class="notebook-title">${notebook.title}</div>
            `;
        }

        // Divide o texto por parágrafos para preservar quebras de linha
        const formattedContent = notebook.content
            .split(/\r?\n/)
            .map(
                (para) =>
                    `<p class="notebook-content">${para.trim() ? para : "&nbsp;"}</p>`
            )
            .join("\n");

        html += `
            <div style="margin-top: 10px;">
                ${formattedContent}
            </div>
        </div>
        <br/>
        `;
    }

    html += `
    </body>
    </html>
    `;

    const blob = new Blob(["\ufeff" + html], {
        type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix.replace(/\s+/g, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
}
