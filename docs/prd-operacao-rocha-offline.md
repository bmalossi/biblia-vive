# PRD: Operação Rocha Offline (Cache-First PWA)

## Problem Statement

O leitor da Bíblia Vive precisa acessar a Palavra de Deus em qualquer lugar, mesmo sem conexão à internet. No passado, a estratégia de armazenamento causou um inchaço de storage que atingiu 200MB no dispositivo do usuário devido ao cache descontrolado de mídias de áudio e arquivos desnecessários. Sem um Service Worker configurado com regras cirúrgicas de expiração e prioridade para os dados bíblicos, a experiência offline era frágil ou inexistente.

## Solution

Implementar a **Operação Rocha Offline**: uma solução PWA baseada em `vite-plugin-pwa` e **Workbox** com a estratégia `injectManifest` (`src/sw.ts`). 

A solução garante:
1. **Rocha Offline Instantânea**: Download e precache imediato do App Shell e de todos os 66 livros em JSON consolidados da versão autoritativa **ACF** (~2MB gzipped), garantindo a Bíblia completa no bolso do leitor sem depender da rede.
2. **Runtime Caching com Soberania**: Estratégia `CacheFirst` para outras versões bíblicas (NVI, ARC, Grego) e `StaleWhileRevalidate` para lista de artigos e metadados de planos de leitura.
3. **Gestão Anti-Inchaço (Storage Protegido)**: Aplicação de `ExpirationPlugin` em todas as rotas dinâmicas (ex: limite rigoroso de 20 imagens ou 7 dias de retenção para mídias de artigos).
4. **Isolamento Radical de Áudio**: Bypassing de todos os arquivos de áudio (`.mp3` e conexões para `midia.bibliavive.com.br`), deixando o streaming a cargo da camada nativa de mídia HTTP do navegador sem poluir o Cache Storage.
5. **Fallback Offline**: Retorno transparente da página `offline.html` para requisições de navegação sem rede, direcionando o leitor de volta aos capítulos já salvos localmente.

## User Stories

1. As a Leitor, I want the entire ACF Bible text (~2MB gzipped) downloaded automatically during PWA installation, so that I can read any book of the Bible offline with zero latency.
2. As a Leitor, I want static application assets (HTML, CSS, JS, UI icons) cached on installation, so that the App Shell opens instantly even when I am offline.
3. As a Leitor, I want to switch to alternative Bible versions (NVI, ARC, Grego) while online and have them cached on-demand (`CacheFirst`), so that I can study them offline later without inflating my storage upfront.
4. As a Leitor, I want audio tracks (.mp3 and `midia.bibliavive.com.br`) to stream directly over network without auto-saving into PWA Cache Storage, so that my device storage never swells unexpectedly.
5. As a Leitor, I want article lists and reading plan metadata served via `StaleWhileRevalidate`, so that I receive cached content immediately while fresh updates fetch in the background.
6. As a Leitor, I want article images capped at a maximum of 20 items or 7 days validity, so that old images are automatically pruned to preserve local device space.
7. As a Leitor, I want a minimalist `offline.html` page displayed when navigating to uncached pages offline, so that I am guided back to my recently read Bible chapters.
8. As a Leitor, I want push notifications from Firebase Cloud Messaging to continue working seamlessly in background, so that I receive updates even with the PWA service worker active.
9. As a Developer, I want a global `window.checkBibleCache()` inspection tool in the console, so that I can audit storage size per cache bucket and trigger manual purges.

## Implementation Decisions

- **Build Mode (`injectManifest`)**: Configurar `vite-plugin-pwa` em `vite.config.ts` apontando para a fonte `src/sw.ts`. Essa decisão preserva 100% dos manipuladores nativos do Firebase Push Messaging (`fcmMessaging.onBackgroundMessage` e `notificationclick`).
- **Precache Inclusions (`globPatterns`)**: Incluir explicitamente os 66 arquivos JSON consolidados da versão ACF (`bible/pt-br/acf/*/*.json`), `red_letters_verses.json`, `book-contexts.json`, `reading-plans.json` e o `offline.html` no precache do Workbox.
- **Service Worker Core (`src/sw.ts`)**:
  - `precacheAndRoute(self.__WB_MANIFEST)` para registro dos precaches.
  - `registerRoute` com `CacheFirst` + `ExpirationPlugin` para requisições `/bible/**`.
  - `registerRoute` com `StaleWhileRevalidate` + `ExpirationPlugin` (máx. 50 entradas / 7 dias) para rotas dinâmicas de dados `/api/articles`.
  - `registerRoute` com `CacheFirst` + `ExpirationPlugin` (máx. 20 entradas / 7 dias) para mídias estáticas de artigos (`/og/`, `/icons/`).
  - Pass-Through (sem interceptação) para todas as requisições com extensão `.mp3` ou vindas do host `midia.bibliavive.com.br`.
  - Captura de falhas de navegação para retornar `caches.match('/offline.html')`.
- **Diagnostic Inspector (`src/utils/cacheInspector.ts`)**:
  - Módulo utilitário exposto globalmente via `window.checkBibleCache()` e `window.cleanBibleCache()` para listar bytes consumidos por cada bucket de cache e efetuar descarte sob demanda.

## Testing Decisions

- **Test Seam**: O ponto de integração primário de testes é a inspeção dos buckets de cache via `CacheStorage API` e a checagem do manifest de build gerado em `dist/sw.js`.
- **Behavioral Tests**:
  - Testar se requisições para URLs contendo `.mp3` não resultam em entradas nos caches do Workbox.
  - Testar se os 66 arquivos ACF e os arquivos de metadados constam na lista de precache do Service Worker.
  - Testar se a limpeza por `ExpirationPlugin` remove itens que excedam o limite estabelecido (ex: 20 imagens).
- **Prior Art**: Estrutura de testes em `src/tests/` utilizando Vitest para simular adaptadores de dados e mocks do Service Worker.

## Out of Scope

- Pre-downloads automáticos em background de áudio da Harpa Cristã ou capítulos narrados.
- Interface visual complexa no painel de configurações para gerenciamento avançado de cada arquivo individual em cache (o diagnóstico inicial é feito via console/inspector).

## Further Notes

- A decisão de utilizar `injectManifest` foi documentada formalmente no **ADR 0009** (`docs/adr/0009-operacao-rocha-offline-cache-first.md`).
- A terminologia oficial do projeto foi atualizada no **CONTEXT.md** sob o termo **Operação Rocha Offline**.
