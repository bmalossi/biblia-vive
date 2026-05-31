import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function NotFoundPage() {
  usePageMeta({
    title: "Página não encontrada — Bíblia Vive",
    robots: "noindex, nofollow",
  });

  return (
    <Layout>
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
        <p className="font-serif text-7xl text-gold/35">404</p>
        <h1 className="mt-2 text-3xl text-app-text">Página não encontrada</h1>
        <p className="mt-3 text-sm text-app-text-muted">
          O capítulo que você procura pode ter mudado de endereço, ou esta URL não existe.
        </p>
        <p className="mt-6 max-w-lg text-sm text-app-text">“Buscareis e achareis, porque me buscareis de todo o coração.” — Jeremias 29:13</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Ir para a Bíblia</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/busca">Buscar versículo</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
