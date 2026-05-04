# PRD: SEO e Visibilidade para Buscadores e IA

## Problem Statement

O Bíblia Vive é um SPA puro (React + Vite). Crawlers do Google e de IAs como Perplexity e ChatGPT recebem um `index.html` vazio — sem conteúdo de versículos, sem meta tags dinâmicas por rota, sem texto indexável.

Como resultado, páginas de capítulos bíblicos e Planos de Leitura não aparecem em buscas relevantes como "Gênesis 1 ACF" ou "plano de leitura bíblica 30 dias", e o conteúdo não é citado por IAs mesmo quando diretamente relevante. A plataforma perde toda visibilidade orgânica apesar de ter conteúdo de alta qualidade.

## Solution

Implementar **Prerendering Estático** das rotas públicas: um script Node pós-build lê os JSON locais dos capítulos bíblicos (já inclusos no repositório), substitui Placeholders SEO no `index.html` e salva HTMLs estáticos por Rota Canônica. O Vercel serve automaticamente esses arquivos estáticos com prioridade sobre a rewrite genérica do SPA.

Adicionalmente, gerar um `sitemap.xml` com todas as URLs Canônicas para submissão ao Google Search Console.

A solução mantém React 18 + Vite, não requer migração para Next.js, e preserva integralmente a autenticação Supabase e o fluxo de pagamento Stripe.

## User Stories

**Visitantes via buscadores:**

1. Como um Visitante, quero que ao pesquisar "Gênesis 1 ACF" no Google o site apareça nos resultados, para que eu possa acessar o capítulo diretamente.
2. Como um Visitante, quero que ao pesquisar "plano de leitura bíblica 30 dias" o Bíblia Vive apareça entre os resultados, para que eu descubra a plataforma organicamente.
3. Como um Visitante, quero que ao clicar em um resultado do Google sobre um capítulo bíblico, o título e a descrição da página correspondam ao capítulo que quero ler.
4. Como um Visitante, quero que ao compartilhar um capítulo bíblico no WhatsApp ou no Instagram, o preview mostre o nome do livro, capítulo e versão corretamente.
5. Como um Visitante, quero que ao compartilhar um capítulo no LinkedIn ou Facebook, o card de preview exiba informações precisas do capítulo.
6. Como um Visitante, quero que ao compartilhar no X (Twitter), o card do tweet mostre o conteúdo correto do capítulo.

**Visitantes descobertos por IAs:**

7. Como um Visitante que usa ChatGPT, quero que ao perguntar sobre um capítulo bíblico específico, a IA possa citar o Bíblia Vive como fonte.
8. Como um Visitante que usa Perplexity, quero que ao pesquisar sobre um trecho bíblico, o Bíblia Vive apareça entre as fontes referenciadas.
9. Como um Visitante que usa Google AI Overview, quero que o conteúdo do Bíblia Vive seja compreendido estruturalmente pela IA para aparecer em respostas.

**Crawlers e motores de busca:**

10. Como o Googlebot, quero receber o conteúdo textual dos versículos diretamente no HTML inicial, sem precisar executar JavaScript.
11. Como o Bingbot, quero que cada URL canônica (`/acf/{livro}/{capítulo}`) retorne um HTML com meta tags corretas e conteúdo indexável.
12. Como um crawler de IA, quero encontrar um `sitemap.xml` válido listando todas as URLs canônicas da Bíblia.
13. Como o Googlebot, quero encontrar dados estruturados `Schema.org/Chapter` em cada página de capítulo para entender o contexto do conteúdo.
14. Como o Googlebot, quero que versões alternativas de um mesmo capítulo (NVI, ARA, etc.) apontem para a Rota Canônica via `rel=canonical`, evitando conteúdo duplicado.

**Administradores e desenvolvedores:**

15. Como desenvolvedor, quero poder rodar o script de prerendering isoladamente (`npm run prerender`) sem o build completo do Vite, para testar e iterar rapidamente durante o desenvolvimento.
16. Como desenvolvedor, quero que o script de prerendering imprima um relatório ao final com a contagem de arquivos gerados, para confirmar que nenhum capítulo foi omitido.
17. Como desenvolvedor, quero poder validar o JSON-LD gerado com o schema.org Validator antes de fazer deploy.
18. Como desenvolvedor, quero que a geração de meta tags não quebre a lógica existente de `usePageMeta` para usuários reais no browser.

## Implementation Decisions

### Módulos

**1. Template com Placeholders SEO (`index.html`)**
- O template do SPA recebe 10 Placeholders SEO nos pontos corretos do `<head>`
- Os placeholders são comentários HTML (`<!--META_TITLE-->`) que o script substitui por string
- Os 10 placeholders cobrem: título, description, canonical, og:url, og:type, og:title, og:description, og:image, twitter:card e JSON-LD
- O `usePageMeta` continua funcionando para usuários reais sem nenhuma modificação

**2. Script de Prerendering (`scripts/prerender.mjs`)**
- Módulo Node ESM executado após `vite build`
- Interface simples: nenhum argumento obrigatório; lê `dist/index.html` como template base e escreve os HTMLs gerados em `dist/`
- Lê `src/data/books.json` para obter os 66 livros (slugs, nomes, contagem de capítulos)
- Para cada livro, lê o JSON local (`public/bible/pt-br/acf/{slug}/{slug}.json`) — um arquivo por livro, com todos os capítulos em array
- Gera `dist/acf/{slug}/{N}/index.html` para cada Capítulo Indexável (≈1.189 URLs)
- Gera `dist/planos/index.html` com meta tags estáticas da página de Planos de Leitura
- Gera `dist/sitemap.xml` com todas as URLs Canônicas
- Emite relatório ao final: contagem de capítulos gerados, sitemap gerado

**3. JSON-LD por capítulo**
- Tipo: `Schema.org/Chapter` (não BibleChapter — tipo inexistente no Schema.org)
- Campos: `name` (BookName + número), `position` (número do capítulo), `isPartOf` (Book → Bíblia Sagrada), `text` (primeiros 3 versículos concatenados)
- Os primeiros 3 versículos são extraídos diretamente do array do JSON local

**4. Orquestração de build**
- `"build"`: `vite build && node scripts/prerender.mjs` (para deploy no Vercel)
- `"prerender"`: `node scripts/prerender.mjs` (para desenvolvimento local isolado)
- Nenhuma mudança no `vercel.json` — o Vercel já serve arquivos estáticos com prioridade sobre rewrites

### Decisões arquiteturais

- **Versão canônica = ACF** (versão pt-BR mais popular): gera ≈1.189 URLs ao invés de ≈9.512 (8 versões × 1.189), evitando thin content e conteúdo duplicado
- **Sem Puppeteer**: o script lê JSONs locais diretamente, sem browser headless, zero dependências de runtime extras
- **Sem SSR**: abordagem de substituição por string — não usa `renderToString`, sem risco de incompatibilidade com hooks e contextos React existentes
- **Routing do Vercel inalterado**: o Vercel serve arquivos estáticos antes de aplicar rewrites — `dist/acf/gn/1/index.html` tem prioridade sobre a rewrite `/(.*) → /index.html`
- **og:image genérica**: imagem OG única para todos os capítulos bíblicos (`/og/bible-chapter.png`); imagens geradas por capítulo estão fora do escopo

## Testing Decisions

**Bons testes** para este módulo validam comportamento externo (o HTML gerado) e não detalhes de implementação (como o script itera os livros).

**Módulo a testar: Script de Prerendering**

Testes unitários do script devem verificar:
- Dado um JSON de livro mockado (ex.: um livro de 2 capítulos), o script gera exatamente 2 arquivos HTML no diretório correto
- O HTML gerado contém `<title>` com o formato correto (`{BookName} {N} — ACF | Bíblia Vive`)
- O HTML gerado contém `<link rel="canonical">` apontando para a URL canônica absoluta
- O HTML gerado contém `<script type="application/ld+json">` com `@type: "Chapter"`, `position` e `text` corretos
- O `sitemap.xml` gerado contém todas as URLs canônicas esperadas

**Verificação manual (pré-deploy):**
- `npm run build` local → `cat dist/acf/gn/1/index.html | grep '<title>'` deve retornar a tag preenchida
- Validar o JSON-LD no schema.org Validator

**Verificação pós-deploy:**
- `curl https://www.bibliavive.com.br/acf/gn/1 | grep '<title>'` deve retornar o título real do capítulo (não o genérico do SPA)
- Submeter `sitemap.xml` ao Google Search Console

## Out of Scope

- **Migração para Next.js ou framework SSR**: a restrição de manter React + Vite é absoluta
- **Prerendering de versões não-canônicas** (NVI, ARA, etc.): essas versões continuam como SPA normal, com `rel=canonical` apontando para a versão ACF
- **Imagens OG únicas por capítulo**: geração dinâmica de OG images por capítulo (via `@vercel/og` ou similar) está fora do escopo desta entrega
- **Prerendering de rotas autenticadas** (`/conta`, `/minhas-notas`, `/meu-estudo`, etc.): essas rotas dependem de sessão Supabase e não devem ser indexadas
- **Prerendering multilíngue** (en, es): o prerendering cobre apenas pt-BR (ACF); as versões em inglês e espanhol continuam como SPA
- **Planos de Leitura individuais**: não há sub-rotas por plano; apenas `/planos` (lista) é pré-renderizada

## Further Notes

- A estrutura de arquivos `public/bible/{lang}/{version}/{book}/{book}.json` contém todos os capítulos de um livro em um único array — o script lê um arquivo por livro, não por capítulo, o que é eficiente
- O `CONTEXT.md` do projeto foi atualizado com os novos termos canônicos: **Prerendering Estático**, **Rota Canônica**, **URL Canônica**, **Capítulo Indexável** e **Placeholder SEO**
- A ADR-0004 (chain de fallback local JSON → API externa → GitHub) é preservada integralmente; o prerendering usa apenas a camada local, sem tocar na lógica de fallback do cliente
