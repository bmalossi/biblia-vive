import { ImageResponse } from "@vercel/og";

export const config = {
    runtime: "edge",
};

export default async function functionHandler(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        // Parameters
        const title = searchParams.get("title") ?? "Bíblia Viva";
        const verse = searchParams.get("verse") ?? "A intimidade com a Palavra";
        const reference = searchParams.get("ref") ?? "Leia online em bibliaviva.com.br";
        const isCurated = searchParams.get("curated") === "true";

        return new ImageResponse(
            (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "1200px",
                        height: "630px",
                        backgroundColor: "#0d0d0d", // app-bg
                        border: "1px solid #262626", // border
                        position: "relative",
                        fontFamily: "sans-serif",
                    }}
                >
                    {/* Background gold glow accent */}
                    <div
                        style={{
                            position: "absolute",
                            top: -100,
                            left: "50%",
                            marginLeft: -300,
                            width: 600,
                            height: 600,
                            background: "radial-gradient(circle, rgba(200,165,100,0.15) 0%, rgba(13,13,13,0) 70%)",
                            zIndex: 0,
                        }}
                    />

                    {/* Content Container */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            background: "#141414", // app-surface
                            border: "1px solid #262626",
                            borderRadius: "32px",
                            padding: "60px 80px",
                            width: "900px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                            zIndex: 1,
                        }}
                    >
                        {/* Header Label */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "32px",
                                color: "#C8A564", // gold
                                textTransform: "uppercase",
                                letterSpacing: "0.2em",
                                fontSize: "16px",
                                fontWeight: "bold",
                            }}
                        >
                            {isCurated && (
                                <span style={{ fontSize: "20px" }}>✧</span>
                            )}
                            {title}
                        </div>

                        {/* Verse Text: Using standard serif for classic bible look */}
                        <div
                            style={{
                                color: "#E5E5E5", // app-text
                                fontSize: verse.length > 150 ? "32px" : "46px",
                                lineHeight: 1.5,
                                fontFamily: "Georgia, serif", // Safe web-safe serif
                                fontStyle: "italic",
                                marginBottom: "40px",
                                maxWidth: "800px",
                            }}
                        >
                            "{verse}"
                        </div>

                        {/* Reference */}
                        <div
                            style={{
                                color: "#A3A3A3", // app-text-muted
                                fontSize: "22px",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span style={{ color: "#C8A564" }}>—</span> {reference}
                        </div>
                    </div>

                    {/* Logo Bottom */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "32px",
                            left: "50%",
                            marginLeft: "-90px",
                            color: "#A3A3A3",
                            fontSize: "20px",
                            letterSpacing: "0.1em",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            zIndex: 1,
                        }}
                    >
                        <span style={{ color: "#C8A564" }}>✦</span> Bíblia Viva
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        return new Response("Failed to generate OG image", { status: 500 });
    }
}
