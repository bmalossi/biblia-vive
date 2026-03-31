import { forwardRef } from "react";

export interface CardData {
    verseNumber: number;
    verseText: string;
    bookName: string;
    chapter: number;
    version: string;
}

// ─── Template 1: Pergaminho ───────────────────────────────────────────────
export const TemplatePergaminho = forwardRef<HTMLDivElement, { data: CardData }>(
    function TemplatePergaminho({ data }, ref) {
        return (
            <div
                ref={ref}
                data-card-template="true"
                style={{
                    width: 540,
                    height: 540,
                    background: "linear-gradient(145deg, #f5ede0 0%, #ede0c8 60%, #e0d0b0 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 56px",
                    position: "relative",
                    fontFamily: "'Lora', 'Georgia', serif",
                    boxSizing: "border-box",
                }}
            >
                {/* Corner ornaments */}
                <div style={{ position: "absolute", top: 20, left: 20, fontSize: 16, color: "#b8962a", opacity: 0.6 }}>✦</div>
                <div style={{ position: "absolute", top: 20, right: 20, fontSize: 16, color: "#b8962a", opacity: 0.6 }}>✦</div>
                <div style={{ position: "absolute", bottom: 20, left: 20, fontSize: 16, color: "#b8962a", opacity: 0.6 }}>✦</div>
                <div style={{ position: "absolute", bottom: 20, right: 20, fontSize: 16, color: "#b8962a", opacity: 0.6 }}>✦</div>

                {/* Top divider */}
                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #b8962a88)" }} />
                    <span style={{ color: "#b8962a", fontSize: 18 }}>✦</span>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #b8962a88, transparent)" }} />
                </div>

                {/* Verse text */}
                <p style={{
                    fontStyle: "italic",
                    fontSize: 22,
                    lineHeight: 1.6,
                    color: "#3d2b1a",
                    textAlign: "center",
                    margin: 0,
                    letterSpacing: "0.01em",
                }}>
                    "{data.verseText}"
                </p>

                {/* Bottom divider */}
                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, marginTop: 28, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #b8962a88)" }} />
                    <span style={{ color: "#b8962a", fontSize: 18 }}>✦</span>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #b8962a88, transparent)" }} />
                </div>

                {/* Reference */}
                <p style={{ fontSize: 13, color: "#7a5c3a", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", margin: 0 }}>
                    {data.bookName} {data.chapter}:{data.verseNumber} · {data.version.toUpperCase()}
                </p>

                {/* Brand */}
                <p style={{ position: "absolute", bottom: 14, right: 18, fontSize: 9, color: "#b8962a99", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "sans-serif", margin: 0 }}>
                    Bíblia Vive
                </p>
            </div>
        );
    }
);

// ─── Template 2: Minimalista Light ────────────────────────────────────────
export const TemplateMinimalista = forwardRef<HTMLDivElement, { data: CardData }>(
    function TemplateMinimalista({ data }, ref) {
        return (
            <div
                ref={ref}
                data-card-template="true"
                style={{
                    width: 540,
                    height: 540,
                    background: "#FAFAF8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "64px 60px",
                    position: "relative",
                    boxSizing: "border-box",
                    fontFamily: "'Lora', 'Georgia', serif",
                    border: "1px solid #e0d8c8",
                }}
            >
                <div style={{ position: "absolute", top: 0, left: 60, right: 60, height: 3, background: "#c9a84c" }} />

                <p style={{
                    fontSize: 22,
                    lineHeight: 1.7,
                    color: "#1a1612",
                    textAlign: "center",
                    fontStyle: "italic",
                    margin: 0,
                    marginBottom: 32,
                }}>
                    "{data.verseText}"
                </p>

                <p style={{ fontSize: 13, color: "#c9a84c", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", margin: 0 }}>
                    {data.bookName} {data.chapter}:{data.verseNumber}
                </p>
                <p style={{ fontSize: 10, color: "#a09880", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", margin: 0, marginTop: 4 }}>
                    {data.version.toUpperCase()} · Bíblia Vive
                </p>
            </div>
        );
    }
);

// ─── Template 3: Story Dark (9:16) ────────────────────────────────────────
export const TemplateStory = forwardRef<HTMLDivElement, { data: CardData }>(
    function TemplateStory({ data }, ref) {
        return (
            <div
                ref={ref}
                data-card-template="true"
                style={{
                    width: 360,
                    height: 640,
                    background: "linear-gradient(160deg, #1a1410 0%, #0f0c09 50%, #1f1a12 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 44px",
                    position: "relative",
                    boxSizing: "border-box",
                    fontFamily: "'Lora', 'Georgia', serif",
                }}
            >
                {/* Glow */}
                <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)" }} />

                {/* Top logo area */}
                <p style={{ position: "absolute", top: 36, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "#c9a84c99", letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "sans-serif", margin: 0 }}>
                    ✦ Bíblia Vive ✦
                </p>

                <p style={{
                    fontSize: 22,
                    lineHeight: 1.7,
                    color: "#f0e8d8",
                    textAlign: "center",
                    fontStyle: "italic",
                    margin: 0,
                    marginBottom: 36,
                }}>
                    "{data.verseText}"
                </p>

                <div style={{ width: 40, height: 1, background: "#c9a84c88", marginBottom: 20 }} />

                <p style={{ fontSize: 12, color: "#c9a84c", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", margin: 0, textAlign: "center" }}>
                    {data.bookName} {data.chapter}:{data.verseNumber}
                </p>
                <p style={{ fontSize: 10, color: "#7a6844", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", margin: 0, marginTop: 4 }}>
                    {data.version.toUpperCase()}
                </p>
            </div>
        );
    }
);

// ─── Template 4: Twitter/X Banner ─────────────────────────────────────────
export const TemplateBanner = forwardRef<HTMLDivElement, { data: CardData }>(
    function TemplateBanner({ data }, ref) {
        return (
            <div
                ref={ref}
                data-card-template="true"
                style={{
                    width: 600,
                    height: 314,
                    background: "#141210",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    padding: "48px 56px 48px 60px",
                    position: "relative",
                    boxSizing: "border-box",
                    fontFamily: "'Lora', 'Georgia', serif",
                }}
            >
                {/* Golden left accent */}
                <div style={{ position: "absolute", left: 0, top: 40, bottom: 40, width: 3, background: "linear-gradient(180deg, transparent, #c9a84c, transparent)" }} />

                <p style={{
                    fontSize: 19,
                    lineHeight: 1.65,
                    color: "#ede8d8",
                    fontStyle: "italic",
                    margin: 0,
                    marginBottom: 24,
                    maxWidth: 480,
                }}>
                    "{data.verseText}"
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <p style={{ fontSize: 11, color: "#c9a84c", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", margin: 0 }}>
                        {data.bookName} {data.chapter}:{data.verseNumber}
                    </p>
                    <span style={{ color: "#7a6844", fontSize: 10 }}>·</span>
                    <p style={{ fontSize: 10, color: "#7a6844", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "sans-serif", margin: 0 }}>
                        Bíblia Vive · {data.version.toUpperCase()}
                    </p>
                </div>
            </div>
        );
    }
);

// ─── Template 5: Editorial Quotes ─────────────────────────────────────────
export const TemplateEditorial = forwardRef<HTMLDivElement, { data: CardData }>(
    function TemplateEditorial({ data }, ref) {
        return (
            <div
                ref={ref}
                data-card-template="true"
                style={{
                    width: 540,
                    height: 540,
                    background: "#f5f2ec",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "56px 52px",
                    position: "relative",
                    boxSizing: "border-box",
                    fontFamily: "'Lora', 'Georgia', serif",
                }}
            >
                {/* Large decorative open quote */}
                <span style={{
                    position: "absolute",
                    top: 24,
                    left: 44,
                    fontSize: 120,
                    lineHeight: 1,
                    color: "#c9a84c",
                    opacity: 0.18,
                    fontFamily: "Georgia, serif",
                    userSelect: "none",
                }}>"</span>

                {/* Asymmetric top bar */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "65%", height: 5, background: "#141210" }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: "30%", height: 5, background: "#c9a84c" }} />

                <p style={{
                    fontSize: 21,
                    lineHeight: 1.65,
                    color: "#1a1612",
                    fontStyle: "italic",
                    margin: 0,
                    marginBottom: 28,
                }}>
                    {data.verseText}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 12, color: "#c9a84c", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", margin: 0 }}>
                        {data.bookName} {data.chapter}:{data.verseNumber}
                    </p>
                    <p style={{ fontSize: 9, color: "#b0a090", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "sans-serif", margin: 0 }}>
                        Bíblia Vive
                    </p>
                </div>
            </div>
        );
    }
);

export type TemplateId = "pergaminho" | "minimalista" | "story" | "banner" | "editorial";

export const TEMPLATES: { id: TemplateId; label: string; format: string }[] = [
    { id: "pergaminho", label: "Pergaminho", format: "1:1" },
    { id: "minimalista", label: "Minimalista", format: "1:1" },
    { id: "story", label: "Story", format: "9:16" },
    { id: "banner", label: "Twitter / X", format: "16:9" },
    { id: "editorial", label: "Editorial", format: "1:1" },
];
