# ADR 0009: Operação Rocha Offline (Cache-First PWA & Workbox)

## Contexto e Problema
A Bíblia Vive é um PWA focado em leitura bíblica com meta de carregamento zero e disponibilidade offline total. No passado, o storage local do navegador atingiu 200MB por falta de critérios de expiração de mídias e assets desnecessários.

## Decisão
Implementar a **Operação Rocha Offline** utilizando `vite-plugin-pwa` e **Workbox** com a estratégia `injectManifest` (`src/sw.ts`):

1. **Precache Inicial de Alta Prioridade**:
   - App Shell (HTML, JS, CSS, Fontes locais, Ícones).
   - Arquivos fundamentais da Bíblia canônica (ACF): 66 JSONs consolidados de livros (`bible/pt-br/acf/*/*.json`), `red_letters_verses.json`, `book-contexts.json`, `reading-plans.json`.
   - Página de fallback offline minimalista (`offline.html`).

2. **Runtime Caching Cirúrgico**:
   - `CacheFirst` para requisições de texto bíblico sob demanda (outras versões: NVI, ARC, Grego, etc.).
   - `StaleWhileRevalidate` para lista de Artigos e metadados de Planos de Leitura (máx. 50 entradas / 7 dias).
   - `CacheFirst` com `ExpirationPlugin` para imagens de artigos (máx. 20 imagens / 7 dias).

3. **Isolamento Radical de Áudio**:
   - Arquivos `.mp3` e conexões para `midia.bibliavive.com.br` utilizam Pass-Through (nunca interceptados nem mantidos pelo Service Worker), evitando estouro de storage de mídia.

4. **Compatibilidade Push**:
   - Preservar manipuladores nativos do Firebase Cloud Messaging (`onBackgroundMessage`, `notificationclick`) dentro de `src/sw.ts`.

## Consequências
- Instalação leve e confiável do PWA com acesso instantâneo aos 66 livros da Bíblia ACF offline.
- Proteção total do armazenamento do leitor contra inchaço (anti-bloat com `ExpirationPlugin`).
- Mídia de áudio isolada em streaming HTTP nativo.
