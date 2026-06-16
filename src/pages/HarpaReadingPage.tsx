import Layout from "@/components/Layout";
import HarpaWorshipCard from "@/components/HarpaWorshipCard";
import hymnsData from "@/data/harpa-hymns.json";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Strophe {
  numero: number;
  titulo: string;
  estrofe: number;
  texto: string;
}

const LoadingLines = () => (
  <div className="min-h-[520px] space-y-3.5 pt-1">
    {[100, 94, 97, 89, 92, 96, 84, 91, 95, 88].map((width, index) => (
      <Skeleton className="h-7 bg-app-raised" key={index} style={{ width: `${width}%` }} />
    ))}
  </div>
);

function isChorusLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Chorus lines are fully uppercase and do NOT start with a digit (verse number)
  return trimmed === trimmed.toUpperCase() && !/^\d/.test(trimmed);
}

export default function HarpaReadingPage() {
  const { hymnNumber } = useParams();
  const navigate = useNavigate();
  const [strophes, setStrophes] = useState<Strophe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numero = useMemo(() => parseInt(hymnNumber ?? "", 10), [hymnNumber]);

  const hymnInfo = useMemo(
    () => (isNaN(numero) ? null : hymnsData.find((h) => h.numero === numero) || null),
    [numero]
  );

  // Ordered list of hymn numbers for prev/next navigation
  const allNumbers = useMemo(() => hymnsData.map((h) => h.numero), []);
  const currentIndex = useMemo(() => allNumbers.indexOf(numero), [allNumbers, numero]);
  const prevNumber = currentIndex > 0 ? allNumbers[currentIndex - 1] : null;
  const nextNumber = currentIndex < allNumbers.length - 1 ? allNumbers[currentIndex + 1] : null;

  useEffect(() => {
    if (isNaN(numero) || !hymnInfo) {
      setError("Hino não encontrado ou número inválido.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setStrophes([]);

    const fetchHymnData = async () => {
      try {
        // Discover which strophe files exist dynamically via hymnInfo.estrofes
        const promises = Array.from({ length: hymnInfo.estrofes }, (_, i) => {
          const stropheNum = i + 1;
          return fetch(`/bible/harpa/${numero}/${stropheNum}.json`).then((res) => {
            if (!res.ok) throw new Error(`Failed to load strophe ${stropheNum}`);
            return res.json() as Promise<Strophe>;
          });
        });

        const results = await Promise.allSettled(promises);
        const loaded: Strophe[] = results
          .filter((r): r is PromiseFulfilledResult<Strophe> => r.status === "fulfilled")
          .map((r) => r.value);

        loaded.sort((a, b) => a.estrofe - b.estrofe);

        if (!cancelled) {
          setStrophes(loaded);
          setLoading(false);
        }
      } catch (err) {
        console.error("[HarpaReadingPage] Error fetching hymn:", err);
        if (!cancelled) {
          setError("Não foi possível carregar este hino. Tente novamente.");
          setLoading(false);
        }
      }
    };

    fetchHymnData();
    return () => { cancelled = true; };
  }, [numero, hymnInfo]);

  usePageMeta({
    canonical: `/harpa/${numero}`,
    description: hymnInfo
      ? `Letra completa do Hino ${hymnInfo.numero} — ${hymnInfo.tituloFormatado} da Harpa Cristã. Louve e adore com a letra e áudio.`
      : "Leia as letras dos hinos da Harpa Cristã.",
    ogImage: "/og-default.png",
    title: hymnInfo
      ? `Hino ${hymnInfo.numero}: ${hymnInfo.tituloFormatado} — Harpa Cristã`
      : "Harpa Cristã",
    ogType: "article",
  });

  if (isNaN(numero) || !hymnInfo) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[360px] w-full max-w-[680px] flex-col items-center justify-center px-4 text-center md:px-6">
          <Alert className="w-full border-border bg-app-surface">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hino não encontrado</AlertTitle>
            <AlertDescription>
              O número de hino informado não existe na Harpa Cristã.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/harpa")} type="button">
            Voltar para a Harpa
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full px-0">
        {/* Breadcrumb + controls row — same pattern as ReadingPage */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Breadcrumb>
            <BreadcrumbList className="leading-none">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link className="inline-flex items-center leading-none" to="/">
                    Início
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link className="inline-flex items-center leading-none" to="/harpa">
                    Harpa Cristã
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Hino {numero}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mx-auto w-full flex items-start justify-center gap-4 xl:gap-10">
          {/* Reading article — same container as ReadingPage */}
          <article
            aria-busy={loading}
            aria-live="polite"
            className="w-full shrink-0 rounded-2xl border border-border bg-app-surface px-4 py-7 md:px-6"
            style={{ maxWidth: "var(--column-width)" }}
          >
            {/* Title — same h1 style as ReadingPage */}
            <h1 className="mb-4 text-2xl text-app-text">
              {hymnInfo.tituloFormatado}
              <span className="ml-3 font-mono text-[0.65rem] text-gold opacity-70 uppercase tracking-widest align-middle">
                Hino {String(numero).padStart(3, "0")}
              </span>
            </h1>

            {/* Audio worship card — same position as WorshipCard in ReadingPage */}
            <HarpaWorshipCard hymnNumber={numero} title={hymnInfo.tituloFormatado} />

            {/* Version label — same style as ReadingPage version label */}
            <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-app-text-muted">
              Harpa Cristã
            </p>

            {/* Strophes */}
            {loading ? (
              <div aria-label="Carregando estrofes...">
                <LoadingLines />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Alert className="w-full border-border bg-app-surface">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Não foi possível carregar este hino.</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                  className="mt-2"
                  onClick={() => window.location.reload()}
                  type="button"
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div role="list">
                {strophes.map((strophe) => (
                  <div
                    key={strophe.estrofe}
                    role="listitem"
                    style={{ marginBottom: "var(--verse-spacing, 1.6rem)" }}
                  >
                    {/* Strophe number label — same style as verse number */}
                    <p className="mb-1 font-mono text-[0.65rem] text-gold opacity-70">
                      Estrofe {strophe.estrofe}
                    </p>

                    {/* Strophe text — uses the same CSS vars as bible verse text */}
                    <div
                      style={{
                        fontFamily: "var(--font-reading)",
                        fontSize: "var(--font-size-reading)",
                        lineHeight: "1.85",
                      }}
                    >
                      {strophe.texto.split("\n").map((line, lineIndex) => {
                        const trimmed = line.trim();
                        if (!trimmed) {
                          return <div key={lineIndex} className="h-2" />;
                        }
                        const chorus = isChorusLine(trimmed);
                        return (
                          <p
                            key={lineIndex}
                            className={cn(
                              "text-app-text",
                              chorus && "text-gold font-semibold italic"
                            )}
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Footer navigation — same Button/variant pattern as ReadingPage */}
        <footer
          className="mx-auto mt-2 flex w-full flex-col items-center justify-center gap-4 px-4 py-12 md:px-6"
          role="contentinfo"
          style={{ maxWidth: "var(--column-width)" }}
        >
          <div className="flex w-full items-center justify-center gap-3">
            <Button
              className="group"
              disabled={prevNumber === null}
              onClick={() => prevNumber !== null && navigate(`/harpa/${prevNumber}`)}
              type="button"
              variant="outline"
            >
              ← Hino Anterior
            </Button>
            <Button
              className="group"
              disabled={nextNumber === null}
              onClick={() => nextNumber !== null && navigate(`/harpa/${nextNumber}`)}
              type="button"
              variant="outline"
            >
              Próximo Hino →
            </Button>
          </div>
          <span className="font-sans text-sm text-app-text-muted">
            {numero} / {hymnsData[hymnsData.length - 1]?.numero ?? "640"}
          </span>
        </footer>
      </div>
    </Layout>
  );
}
