# PRD: Sistema de Artigos + Admin + SEO (Prerender)

## Problem Statement

O BibliaVive atualmente não possui uma infraestrutura dedicada para publicação de artigos, o que impede a criação de páginas indexáveis e otimizadas para SEO. Por ser um SPA (React + Vite), o conteúdo não é entregue de forma indexável para crawlers, e não existe um fluxo estruturado para criação de artigos via painel administrativo, gerenciamento de metadados SEO por página, geração de rotas estáticas por conteúdo publicado, e distribuição de conteúdo na home (carrossel).

## Solution

Implementar uma infraestrutura que permita a publicação manual de artigos via painel administrativo, com suporte completo a SEO e prerender estático. A solução contempla: criação de um painel Admin de Artigos para cadastro e edição; definição de campos essenciais (título, slug, descrição, conteúdo); configuração de metadados SEO por artigo; criação de rotas dinâmicas (`/artigos/[slug]`) para cada conteúdo publicado; geração de HTML estático por artigo durante o build (prerender); inclusão de uma seção na home com Carrossel de Artigos; e estrutura preparada para interlinking interno entre artigos e páginas existentes.

## User Stories

1. Como Administrador, quero criar um artigo com título, corpo em Markdown e metadados SEO, para que possa publicar conteúdo editorial indexável.
2. Como Administrador, quero editar um artigo rascunho antes de publicá-lo, para que possa refinar o conteúdo.
3. Como Administrador, quero publicar um artigo, para que ele se torne acessível via rota pública `/artigos/[slug]`.
4. Como Administrador, quero definir meta_title e meta_description para cada artigo, para que os motores de busca exibam títulos e descrições personalizadas nos resultados.
5. Como Administrador, quero marcar artigos como "em destaque" (featured), para que apareçam prioritariamente no Carrossel de Artigos da home.
6. Como Administrador, quero excluir um artigo, para que não seja mais exibido nem indexado.
7. Como Visitante, quero visualizar a página de um artigo publicado, para que possa ler o conteúdo editorial.
8. Como Visitante, quero navegar pelo Carrossel de Artigos na home, para que possa descobrir conteúdos em destaque.
9. Como Visitante, quero acessar a página de listagem de artigos (/artigos), para que possa explorar todos os artigos publicados.
10. Como crawler do Google, quero receber HTML estático com metadados SEO completos para cada artigo, para que o conteúdo seja indexável.
11. Como Administrador, quero que ao publicar um artigo, a Vercel faça rebuild automático, para que o novo artigo seja prerenderizado sem necessidade de ação manual.
12. Como Visitante, quero visualizar a imagem de capa de um artigo quando disponível, para que a experiência visual seja mais rica.
13. Como Administrador, quero visualizar um preview do corpo do artigo em Markdown antes de salvar, para que possa validar a formatação.
14. Como Administrador, quero que o slug seja gerado automaticamente a partir do título, mas seja editável antes da publicação, para que tenha controle sobre a URL.
15. Como Administrador, quero que o slug seja imutável após a publicação, para que não quebre links externos indexados.

## Implementation Decisions

- **Tabela de Artigos (Supabase)**: Criar tabela `articles` com campos canônicos: `id` (uuid, PK), `title` (text, not null), `slug` (text, unique, not null), `body` (text, not null - armazenado em Markdown), `status` (enum: 'rascunho' | 'publicado', default 'rascunho'), `meta_title` (text, nullable), `meta_description` (text, nullable), `cover_image_url` (text, nullable), `featured` (boolean, default false), `created_at` (timestamp), `published_at` (timestamp, nullable). Adicionar RLS policies: leitura pública para artigos publicados, escrita apenas para role admin.

- **Admin Hub**: Converter a página `/admin` existente em ponto de entrada com links de navegação para sub-seções, mantendo o guard de autenticação (app_metadata.role === 'admin').

- **Admin de Artigos**: Criar nova página `/admin/artigos` (AdminArtigosPage.tsx) com: listagem de artigos (tabela/cards com status, título, data), formulário de criação/edição com campos (título, slug automático/editável, corpo Markdown com preview via react-markdown, meta_title, meta_description, cover_image_url, featured toggle), ações de salvar (como rascunho) e publicar, botão de exclusão com confirmação, ordenação por created_at desc.

- **API de Publicação de Artigos**: Criar serverless function `/api/publish-article` que: recebe id do artigo, atualiza status para 'publicado', define published_at, faz POST no Vercel Deploy Hook (URL em VERCEL_DEPLOY_HOOK_URL env var), retorna sucesso/erro.

- **Página de Artigo Individual**: Criar nova página `/artigos/[slug]` (ArtigoPage.tsx) que: busca artigo por slug no Supabase (ou em cache estático no prerender), renderiza título, cover_image_url (se existir), corpo via react-markdown, metadados SEO via usePageMeta, retorna 404 se não encontrado ou não publicado.

- **Página de Listagem de Artigos**: Criar nova página `/artigos` (ArtigosListPage.tsx) que: lista todos os artigos publicados em formato de grid de cards (título, cover_image_url, excerpt de 100 chars do body, data de publicação), ordenados por published_at desc, com link para cada `/artigos/[slug]`.

- **Carrossel de Artigos na Home**: Criar componente ArticlesCarousel para a HomePage que: busca artigos com featured=true ordenados por published_at desc (máximo 6), se não houver nenhum, usa os 6 mais recentes como fallback, cada card exibe cover_image_url (se houver) ou placeholder, título e data, scroll horizontal automático (embla-carousel-react), link para `/artigos/[slug]`.

- **Prerendering de Artigos**: Modificar scripts/prerender.mjs para: fazer fetch na tabela articles (status='publicado') no Supabase (usando SUPABASE_URL e SUPABASE_SERVICE_KEY do ambiente), para cada artigo gerar HTML em dist/artigos/[slug]/index.html com meta tags (title, description, og:image, canonical), warnings não abortam prerender de capítulos bíblicos, sitemap.xml atualizado com URLs de artigos.

- **Deploy Hook de Artigos**: Na ação de publicação do Admin de Artigos, após atualizar o Supabase, chamar API `/api/publish-article` que dispara o rebuild na Vercel.

- **Interlinking Editorial**: Suporte a hyperlinks manuais via sintaxe Markdown padrão no corpo do artigo. Sem detecção automática de padrões no MVP.

## Testing Decisions

- **Testes unitários** para a lógica de transformação de título para slug (geração automática). Prior art: testes em src/test/bookResolver.test.ts.
- **Testes de integração** para o componente de Carrossel de Artigos (renderização, comportamento com artigos em destaque vs fallback). Prior art: testes em src/test/notesHighlights.test.ts.
- **Testes de endpoint** (se necessário) para a API `/api/publish-article`.
- Boa prática: testar apenas comportamento externo (renderização de componentes, respostas de API), não implementação interna (não testar estado interno de componentes React).

## Out of Scope

- Sistema de categorias ou tags para artigos
- Agendamento de publicação (publicação futura)
- Arquivamento de artigos publicados
- Upload de imagens diretamente no painel (admin cola URL externa)
- Detecção automática de padrões para interlinking (smartlinks)
- Autores múltiplos ou hierarquia editorial
- Comentários em artigos
- Busca dentro de artigos
- Versões multilíngues de artigos
- Dashboard analytics de artigos

## Further Notes

- O Deploy Hook requer configuração de variável de ambiente `VERCEL_DEPLOY_HOOK_URL` no painel da Vercel (Settings > Git > Deploy Hooks).
- A tabela `articles` deve ser criada via migration no Supabase, incluindo RLS policies.
- O prerendering de artigos falha silenciosamente (apenas warning) para não impactar o prerendering de capítulos bíblicos que já funciona.
- O slug é editável apenas enquanto o artigo está em estado 'rascunho'. Após publicação, o slug se torna imutável para preservar indexação.
- O corpo do artigo é armazenado em Markdown puro (não HTML) e renderizado no frontend via react-markdown.
- A imagem de capa é uma URL externa (admin gerencia no Cloudflare R2) - sem upload de arquivo no MVP.