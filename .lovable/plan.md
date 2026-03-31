
Objetivo do Sprint 5
- Consolidar o MVP em 4 pilares sem adicionar features novas: PWA instalável/offline, acessibilidade WCAG AA, performance/Core Web Vitals e SEO técnico.
- Decisão confirmada: SEO com domínio dinâmico (usar `window.location.origin` no runtime; para arquivos estáticos, abordagem compatível descrita abaixo).

Plano de implementação (ordem de execução)

1) Infra global (base para tudo)
- `src/main.tsx`: envolver `<App />` com `ErrorBoundary`, registrar `sw.js`, e preparar `Suspense`.
- `src/App.tsx`: lazy-load de rotas (`HomePage`, `BookPage`, `ReadingPage`, `SearchPage`, `NotFoundPage`), fallback de skeleton, incluir `InstallPrompt` e provider do novo sistema de toast.
- `index.html`:
  - PWA tags (`manifest`, `theme-color`, apple tags, favicon svg+ico).
  - otimização de fontes (preconnect + preload stylesheet + noscript fallback).
  - skip link como primeiro elemento do `body`.
  - metas base mínimas (depois sobrescritas por `usePageMeta`).

2) PWA completo
- Criar `public/manifest.json` com estrutura pedida.
- Criar `public/sw.js` com 3 estratégias:
  - `bv-static-v1`: cache-first para assets/fontes;
  - `bv-bible-v1`: stale-while-revalidate + limites (LRU 150 entradas, 30 dias);
  - `bv-pages-v1`: network-first com timeout de 3s.
- Criar `public/offline.html` elegante; leitura de últimos capítulos via script client-side.
- Criar `src/components/InstallPrompt.tsx`:
  - `beforeinstallprompt`, regras de exibição (90s, não dispensado, não standalone, >=2 capítulos lidos),
  - variante iOS com instrução manual e persistência.
- Ícones:
  - criar `src/scripts/generateIcons.ts` para gerar SVG base e PNGs (192/512 prioritários + demais redimensionados para cumprir manifest).
  - adicionar ícones e screenshots em `public/icons` e `public/screenshots`.

3) Acessibilidade e semântica (WCAG 2.1 AA)
- `src/components/Layout.tsx` e `Header.tsx`:
  - landmarks corretos (`header`, `nav`, `main`, `footer`) e `id` de destino do skip link.
- `src/pages/ReadingPage.tsx`:
  - estrutura semântica do capítulo (`article`, `h1`, lista de versículos com `role=list/listitem`),
  - versículos focáveis com `aria-label`, `aria-selected`, Enter/Space abrindo toolbar,
  - ARIA de loading (`aria-busy`, `aria-live`) e toolbar (`role=toolbar`, labels dinâmicos).
- `src/components/SettingsPanel.tsx` + Chapter picker:
  - focus trap com novo `src/hooks/useFocusTrap.ts`,
  - retorno de foco ao gatilho ao fechar,
  - rótulos ARIA completos.
- Busca (`Header.tsx`, `SearchBar.tsx`, `SearchPage.tsx`):
  - combobox/listbox/option + `aria-expanded`, `aria-controls`, `aria-autocomplete`, `aria-describedby`.
- Criar `src/lib/a11y.ts` com `checkContrast(fg, bg)` e warnings em dev.
- `src/index.css`:
  - foco visível consistente (sem `outline: none` sem substituto),
  - `prefers-reduced-motion`,
  - touch targets mínimos 44x44,
  - ajustes de contraste de tons muted/gold por tema.

4) Performance e estabilidade visual
- Code splitting por rota (já no passo 1) + fallback estável.
- `ReadingPage.tsx`:
  - prefetch do próximo capítulo após 5s de permanência;
  - cache em memória + localStorage para evitar refetch;
  - scroll restoration manual por URL via `sessionStorage`.
- `index.css` + componentes:
  - reservar espaço para banner “Continuar leitura” (evitar CLS),
  - skeleton com altura próxima ao conteúdo real,
  - garantir dimensões em imagens e loading lazy/eager apropriado.
- `vite.config.ts`: alinhar política de cache no que for possível no ambiente Vite/SPA; complementar via SW para runtime caching.
- `src/scripts/generateIcons.ts` e assets para reduzir peso e padronizar ícones.

5) SEO técnico dinâmico
- Criar `src/hooks/usePageMeta.ts`:
  - title/description/canonical/OG/Twitter/robots dinâmicos por página.
- Aplicar em:
  - `HomePage` (metas + JSON-LD `WebSite` com `SearchAction`);
  - `ReadingPage` (metas por livro/capítulo + JSON-LD `Article`);
  - `SearchPage` (`noindex` quando `q` presente; canonical sem query).
- Sitemap/robots:
  - criar `src/scripts/generateSitemap.ts` para gerar `public/sitemap.xml` com todas as versões/livros/capítulos.
  - como domínio é dinâmico, usar base URL configurável por ambiente no script (fallback seguro) e em `robots.txt` usar referência de sitemap compatível.
- Atualizar `public/robots.txt` para política de indexação da busca e sitemap.

6) Polimento final de UX
- Substituir toasts de terceiros por sistema leve próprio:
  - criar `src/components/Toast.tsx` + `src/hooks/useToast.ts` (bottom-center, 2.5s, max 3, tipos success/info/error, `aria-live=polite`);
  - integrar nos fluxos: copiar/compartilhar versículo, restaurar preferências, erro de API com retry.
- Criar `src/pages/NotFoundPage.tsx` e ajustar rota catch-all.
- Criar `src/components/ErrorBoundary.tsx` com countdown e reload automático.
- Microinterações:
  - hover cards no `BookGrid`,
  - animação setas prev/next em `ReadingPage`,
  - auto-scroll capítulo atual no modal de capítulos,
  - opacidade do número do versículo no hover,
  - clique no logo com scroll-to-top na home,
  - título da aba sincronizado com capítulo atual.

Arquivos principais a criar
- `public/manifest.json`, `public/sw.js`, `public/offline.html`, `public/sitemap.xml`, `public/robots.txt`
- `src/components/InstallPrompt.tsx`, `src/components/Toast.tsx`, `src/components/ErrorBoundary.tsx`
- `src/pages/NotFoundPage.tsx`
- `src/hooks/useToast.ts`, `src/hooks/useFocusTrap.ts`, `src/hooks/usePageMeta.ts`
- `src/lib/a11y.ts`
- `src/scripts/generateIcons.ts`, `src/scripts/generateSitemap.ts`

Arquivos principais a modificar
- `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `src/index.css`
- `src/pages/HomePage.tsx`, `src/pages/ReadingPage.tsx`, `src/pages/SearchPage.tsx`
- `src/components/Layout.tsx`, `src/components/Header.tsx`, `src/components/SettingsPanel.tsx`, `src/components/BookGrid.tsx`
- `src/hooks/useVerseActions.ts` (integração de toasts)

Riscos/compatibilidade e mitigação
- Sitemap “100% dinâmico” não existe em runtime estático: resolver com script de geração por ambiente + canonical dinâmico no cliente.
- Conflito entre toasts atuais (`sonner`/shadcn) e novo sistema: padronizar para um único provider e remover imports antigos gradualmente.
- A11y regressions em componentes Radix: validar foco/aria em drawer, dialog, toolbar e combobox.

Checklist final de validação
- PWA: install prompt Android/iOS, SW ativo, offline fallback e capítulos já lidos abrindo sem rede.
- A11y: navegação completa por teclado, focus trap, contraste AA, aria announcements corretos, reduced motion.
- Performance: sem CLS perceptível, rotas lazy, prefetch capítulo seguinte, bundle por página.
- SEO: metas dinâmicas corretas, JSON-LD válido, sitemap/robots acessíveis.
- Qualidade: zero erros no console app e service worker.
