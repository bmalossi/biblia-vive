# Bíblia Vive

Plataforma web de leitura bíblica com planos de leitura, gamificação e recursos para igrejas. Em produção em bibliavive.com.br.

## Language

### Usuários

**Visitante**:
Pessoa que acessa a plataforma sem conta criada. Pode ler a Bíblia livremente, sem acesso a planos, notas ou destaques.
_Evitar_: usuário anônimo, leitor não autenticado

**Leitor**:
Pessoa com conta criada na plataforma. Tem acesso a planos de leitura, notas, destaques e gamificação.
_Evitar_: usuário, user, membro

### Planos e Leitura

**Plano de Leitura**:
Template curado com título, descrição e uma sequência de dias, cada um com uma lista de Referências a ler.
_Evitar_: plano, programa, cronograma de leitura

**Referência**:
Unidade mínima de leitura dentro de um dia de um Plano de Leitura. Identifica um capítulo de um livro bíblico (ex.: `sl/1` = Salmos capítulo 1).
_Evitar_: capitulo, trecho, passagem

**Progresso**:
Estado de um Leitor em um Plano de Leitura específico: data de início, dias concluídos e referências lidas. Persiste localmente e na nuvem.
_Evitar_: avanço, status do plano

**Dias Concluídos**:
Contagem acumulada dos dias em que um Leitor completou todas as Referências de um Plano de Leitura. Não é uma sequência — não quebra por dias perdidos. Exibido como motivação ("X dias de alimento da Palavra").
_Evitar_: streak, sequência, dias consecutivos

### Estudo Pessoal

**Destaque**:
Cor aplicada por um Leitor a um versículo específico. Um versículo suporta no máximo um Destaque por Leitor.
_Evitar_: marcação, sublinhado, coloração

**Nota**:
Texto livre escrito por um Leitor sobre um versículo específico. Uma Nota por versículo por Leitor. Independente do Destaque.
_Evitar_: anotação, comentário, observação

### Conteúdo Bíblico

**Versão**:
Uma tradução/edição específica da Bíblia, identificada por sigla. O produto suporta múltiplos idiomas e versões simultaneamente. Versões disponíveis: pt-br (AA, ACF, ARC, KJA, NVI), en (BBE, KJV), es (RVR).
_Evitar_: tradução (ambíguo), idioma (incompleto — uma versão é idioma + editora)

**Versículo do Dia**:
Um versículo bíblico curado pelo administrador via Supabase, exibido na página inicial. Quando nenhum versículo está agendado para o dia, a plataforma exibe um versículo estático de fallback. Disponível para Visitantes e Leitores.
_Evitar_: verso do dia, devoción diária

### Planos e Acessos

**Leitor Gratuito**:
Leitor sem assinatura paga. Acesso às funcionalidades básicas da plataforma.
_Evitar_: free, usuário free, plano básico

**Leitor Pro**:
Leitor com assinatura Pro ativa. Acesso a funcionalidades avançadas de leitura individual.
_Evitar_: premium, subscriber, assinante

**Templo**:
Plano de assinatura B2B para igrejas. Inclui todas as funcionalidades Pro e acesso exclusivo ao Modo Igreja. Não é destinado a pessoas físicas.
_Evitar_: plano institucional, plano grupo

**Modo Igreja**:
Funcionalidade exclusiva do plano Templo. Permite ao responsável pela igreja selecionar versículos na plataforma e projetá-los em tempo real em uma segunda tela (projetor). Opera via uma aba separada (`/church-display`) sincronizada por mensagens.
_Evitar_: modo projeção, modo culto, modo apresentação

## Relationships

- Um **Leitor** pode estar matriculado em múltiplos **Planos de Leitura** simultaneamente
- Um **Plano de Leitura** tem muitos **Dias**, cada um com uma ou mais **Referências**
- Um **Leitor** tem exatamente um **Progresso** por **Plano de Leitura** ativo
- Um **Destaque** pertence a exatamente um versículo de um **Leitor**
- Uma **Nota** pertence a exatamente um versículo de um **Leitor**
- **Destaque** e **Nota** no mesmo versículo são independentes — um não implica o outro
- **Templo** é um superconjunto de **Pro**: todo Leitor com Templo também tem acesso a Pro
- **Modo Igreja** só está disponível para Leitores com plano **Templo** ativo

## Example dialogue

> **Dev:** "O Leitor completou 30 dias — vou incrementar o streak."
> **Domain expert:** "Não. Aqui chamamos de Dias Concluídos, e a contagem nunca regride — mesmo que o Leitor pule dias. Não é um streak no sentido clássico."

> **Dev:** "A igreja quer projetar os versículos no culto — preciso de uma conta de usuário?"
> **Domain expert:** "Não de usuário — de plano Templo. O Modo Igreja é exclusivo desse plano B2B."

### SEO e Indexação

**Prerendering Estático**:
Processo de gerar arquivos HTML estáticos para cada rota pública durante o build, permitindo que crawlers recebam conteúdo sem executar JavaScript. Executado por `scripts/prerender.mjs` após `vite build`.
_Evitar_: SSR (não há servidor), pre-rendering (anglicismo)

**Rota Canônica**:
Rota `acf/{livro}/{capítulo}` que representa a URL autoritativa de um capítulo para fins de indexação. Versões alternativas (NVI, ARC, etc.) da mesma Referência apontam para a Rota Canônica via `<link rel="canonical">`.
_Evitar_: página principal, rota padrão

**URL Canônica**:
URL completa e absoluta de uma Rota Canônica. Formato: `https://www.bibliavive.com.br/acf/{slug}/{N}`. Injetada nos placeholders `META_CANONICAL` e `META_OG_URL`.

**Capítulo Indexável**:
Unidade mínima de indexação SEO — corresponde exatamente a uma Referência de um Plano de Leitura. Gera aproximadamente 1.189 URLs canônicas (66 livros × capítulos respectivos, versão ACF).
_Evitar_: página de versículo (muito granular), página de livro (pouco granular)

**Placeholder SEO**:
Comentário HTML inserido no `index.html` e substituído pelo script de prerendering com os valores reais de cada rota. Exemplo: `<!--META_TITLE-->` → `<title>Gênesis 1 — ACF | Bíblia Vive</title>`.

**Prerendering de Artigos**:
Etapa adicionada ao script `scripts/prerender.mjs` existente que itera sobre os Artigos Publicados no Supabase e gera HTML estático para cada rota `/artigos/[slug]`. Executa após o prerendering de capítulos bíblicos. Falhas na query de artigos geram apenas um warning no log sem abortar o prerendering de capítulos.
_Evitar_: script separado de artigos, prerender paralelo

**Deploy Hook de Artigos**:
Mecanismo que dispara rebuild automático na Vercel ao publicar um Artigo. Ao clicar em "Publicar" no Admin de Artigos, o frontend chama a serverless function `/api/publish-article`, que persiste o Artigo no Supabase e faz POST no Deploy Hook da Vercel. A URL do hook é armazenada em `VERCEL_DEPLOY_HOOK_URL` (variável de ambiente server-side). Rebuild leva aproximadamente 2 minutos.
_Evitar_: webhook de publicação, trigger manual

### Conteúdo Editorial

**Artigo**:
Conteúdo editorial publicado pelo administrador na plataforma, com título, slug, conteúdo textual e metadados SEO. Independente de Versículo, Referência ou Plano de Leitura — pode ou não referenciar conteúdo bíblico. Acessível a Visitantes e Leitores via rota pública `/artigos/[slug]`. Autoria exclusiva do Administrador (sem hierarquia de papéis editoriais por ora).
_Evitar_: post, blog post, publicação, newsroom

**Slug**:
Identificador único de URL de um Artigo, gerado automaticamente a partir do título no momento da criação (ex: "Como orar todos os dias" → `como-orar-todos-os-dias`). Pode ser ajustado pelo Administrador antes da publicação. Após publicação, o Slug é imutável para preservar indexação e links externos.
_Evitar_: URL amigável, permalink, handle

**Rascunho**:
Estado inicial de um Artigo recém-criado. Visível apenas no painel admin. Não gera rota pública nem HTML no prerendering.
_Evitar_: rascunho não publicado, artigo oculto, draft

**Publicado**:
Estado final de um Artigo aprovado para exibição pública. Acessível via `/artigos/[slug]`, indexado por crawlers e processado no prerendering. Transição irreversível em relação ao Slug (que se torna imutável). Não há estados de agendamento ou arquivamento.
_Evitar_: ativo, visível, ao vivo

**Tabela de Artigos**:
Persistência dos Artigos na tabela `articles` do Supabase (PostgreSQL). Campos canônicos: `id`, `title`, `slug`, `body`, `status` (rascunho | publicado), `meta_title`, `meta_description`, `created_at`, `published_at`. O script de prerendering faz fetch nessa tabela no build para gerar HTML estático por Artigo Publicado.
_Evitar_: banco de artigos, repositório de conteúdo

**Corpo do Artigo**:
Conteúdo principal de um Artigo, armazenado no campo `body` como texto em **Markdown**. O painel admin exibe um editor com preview ao vivo. O frontend renderiza via `react-markdown`. Não é armazenado como HTML nem texto simples.
_Evitar_: html do artigo, conteúdo rico, body HTML

**Carrossel de Artigos**:
Seção da página inicial que exibe Artigos em movimento automático (scroll horizontal). Prioriza Artigos com `featured = true`, ordenados por `published_at` desc, limitado a 6 itens. Se não houver nenhum artigo em destaque, exibe os 6 mais recentes como fallback. Cada card é um link para `/artigos/[slug]`.
_Evitar_: banner de artigos, slider, lista de posts

**Artigo em Destaque**:
Artigo marcado pelo Administrador com `featured = true` para aparecer no Carrossel de Artigos. A ordenação é por data de publicação (mais recente primeiro), sem drag-and-drop manual.
_Evitar_: artigo fixado, pinado, featured post

**Admin Hub**:
Página `/admin` refatorada como ponto de entrada do painel administrativo, com links para sub-seções. Não contém formulários diretamente. Reutiliza o guard de autenticação (`app_metadata.role === 'admin'`) e delega a lógica de cada domínio para páginas específicas.
_Evitar_: dashboard, painel único, admin monolítico

**Admin de Artigos**:
Página `/admin/artigos` (`AdminArtigosPage.tsx`) responsável pelo CRUD completo de Artigos: listagem, criação, edição com preview Markdown, publicação e exclusão. Reutiliza o mesmo guard de autenticação do Admin Hub.
_Evitar_: editor de posts, CMS de artigos

**Página de Artigos**:
Página pública `/artigos` que lista todos os Artigos Publicados em formato de grade de cards, ordenados por `published_at` desc. Recebe prerendering estático. Linkada no footer e/ou menu de navegação. Serve como destino para leitores que chegam via Carrossel ou links externos e querem explorar mais conteúdo.
_Evitar_: blog, índice de posts, newsroom

**Interlinking Editorial**:
Prática de incluir hiperlinks dentro do Corpo do Artigo para outras páginas do site (capítulos bíblicos, outros Artigos, planos). Implementado manualmente pelo Administrador via sintaxe Markdown padrão. Não há detecção automática de padrões (smartlinks) no MVP.
_Evitar_: smartlinks, link automático, link interno inteligente

**Imagem de Capa**:
Campo opcional `cover_image_url` (string) na tabela `articles`. URL de imagem externa gerenciada pelo Administrador no Cloudflare R2. Exibida no card do Carrossel de Artigos e no topo da página do Artigo. Artigos sem imagem de capa exibem um placeholder ou ficam sem imagem. Sem upload de arquivo no MVP — o admin cola a URL diretamente no painel.
_Evitar_: thumbnail, banner do artigo, featured image

## Inteligência Artificial e Estudo

**Função de Comentário (Edge Function)**:
Serviço Supabase Edge Function (`/functions/v1/commentary`) que utiliza RAG (Retrieval-Augmented Generation) para fornecer comentários teológicos históricos (Albert Barnes, Matthew Henry, John Gill, etc.) sobre versículos ou capítulos. Utiliza embeddings da OpenAI (`text-embedding-3-small`) para busca semântica em `commentary_chunks` e GPT-5-mini para selecionar e formatar os trechos originais. Suporta tradução automática para português e espanhol preservando a literalidade.
_Evitar_: comentários da IA (são comentários históricos recuperados pela IA), bot de teologia.

**Busca Semântica (match_commentary_chunks)**:
Função RPC no Supabase que realiza busca por similaridade de cosseno entre o embedding da consulta e os fragmentos de comentários armazenados. Filtra por livro, capítulo e opcionalmente versículo.

**Cache de Estudo (ai_study_cache)**:
Tabela Supabase que armazena as respostas estruturadas das funções de IA para evitar chamadas redundantes à OpenAI e reduzir a latência para o Leitor. Chave primária: `verse_id` + `question_type` (ex: `JHN.3.16` + `commentary`).

## Harpa Cristã

**Hino**:
Unidade mínima da Harpa Cristã que representa uma canção de louvor, contendo número sequencial (`numero`), título oficial (`titulo`), título formatado (`tituloFormatado`), quantidade de estrofes (`estrofes`) e flag de áudio (`hasAudio`).
_Evitar_: música, louvor, canção

**Estrofe**:
Cada um dos blocos de texto que constituem a letra de um Hino. Armazenada e carregada assincronamente a partir de arquivos JSON locais em `public/bible/harpa/[numero]/[estrofe].json`.
_Evitar_: parágrafo, estrofe de hino

**Destaque do Coro**:
Estilização visual automática (itálico e dourado) aplicada a linhas do refrão/coro de um Hino, identificadas em caixa alta e que não iniciam com número.
_Evitar_: refrão estilizado

**Sinalizador de Áudio (hasAudio)**:
Badge visual (ícone de alto-falante `Volume2`) exibido nos cards da grade de hinos. Indica de forma estática (pré-calculada durante o build no script `generate-harpa-list.ts`) se o arquivo `.mp3` correspondente existe no R2 Cloudflare.
_Evitar_: indicador dinâmico de áudio

**Colaboração de Áudio**:
Banner explicativo na listagem de hinos orientando sobre a identificação dos áudios e convocando leitores a contribuírem com arquivos de hinos faltantes via e-mail `suporte@bibliavive.com.br`.

## Flagged ambiguities

- "streak" aparece no código em `useReadingPlan.ts` como nome da variável para `completedDays.length`. O conceito de domínio é **Dias Concluídos**; "streak" é apenas o nome técnico da variável.
- "Bíblia Vive Leitura" aparece no nome do repositório por razão histórica; o nome canônico do produto é **Bíblia Vive**.
