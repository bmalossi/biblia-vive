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

**Modo Clausura**:
Estado de inatividade contemplativa na tela de leitura em que toda a interface periférica do usuário (header, footer, nav móvel, menus e FABs da página) desvanece suavemente após exatamente 30 segundos de inatividade total, restando apenas o container do texto bíblico. A restauração da UI é instantânea ao detectar movimento significativo do mouse (>10px), clique, toque em telas sensíveis ou pressionamento de tecla. A ação de scroll da página mantém o leitor em leitura e NÃO restaura a interface. A ativação é bloqueada se houver modais, o Painel de Estudo, a barra de ações de versículo (`VerseToolbar`) abertos ou se o tocador de áudio estiver em reprodução.
_Evitar_: modo foco automático, auto-hide, tela cheia passiva

### Estudo Pessoal

**Destaque**:
Cor aplicada por um Leitor a um versículo específico. Um versículo suporta no máximo um Destaque por Leitor.
_Evitar_: marcação, sublinhado, coloração

**Meu Memorial**:
Espaço pessoal do Leitor (anteriormente denominado Caderno) onde são preservados os registros da sua caminhada espiritual com Deus ao longo do tempo. Acessível via rota `/memorial`.
_Evitar_: caderno (na UI), bloco de notas, agenda, diário, notion

**Registro do Memorial**:
Unidade individual de memória espiritual vinculada a uma Referência (livro, capítulo e versículo opcional). Pertence a uma de 4 categorias: Reflexão, Oração, Testemunho ou Jejum/Propósito.
_Evitar_: nota, anotação, post, card

**Reflexão**:
Categoria de Registro do Memorial focada no estudo e meditação da Palavra (modelo SOAP). Cor institucional: Dourado.

**Oração**:
Categoria de Registro do Memorial para registro de motivos, pedidos e entregas diante de Deus, podendo registrar posteriormente a Resposta. Cor institucional: Azul discreto.

**Testemunho**:
Categoria de Registro do Memorial para registro de fatos marcantes e como Deus sustentou o Leitor na caminhada. Cor institucional: Verde suave.

**Jejum / Propósito**:
Categoria de Registro do Memorial para acompanhamento de períodos dedicados de busca espiritual com data inicial, data prevista e status. Cor institucional: Cinza ardósia.

### Conteúdo Bíblico

**Versão**:
Uma tradução/edição específica da Bíblia, identificada por sigla. O produto suporta múltiplos idiomas e versões simultaneamente. Versões disponíveis: pt-br (AA, ACF, ARC, KJA, NVI), en (BBE, KJV), es (RVR).
_Evitar_: tradução (ambíguo), idioma (incompleto — uma versão é idioma + editora)

**Capítulo de Hoje**:
Componente editorial da página inicial que exibe um capítulo narrativo curado da Jornada Narrativa de Permanência. Substitui definitivamente o Versículo do Dia. Composto exclusivamente por texto (título principal, texto introdutório, convite para leitura e botão de acesso à Referência). Sem imagens, criativos ou carrosséis. Publicado de forma programada via Supabase. Quando nenhum capítulo está agendado para o dia, exibe o capítulo publicado mais recentemente como fallback (nunca exibe vazio). Disponível para Visitantes e Leitores.
_Evitar_: Versículo do Dia, verso do dia, devoção diária, devocional

**Série**:
Agrupamento editorial de capítulos do Capítulo de Hoje com tema narrativo comum (ex.: "Permanecer"). Cada capítulo pertence a exatamente uma Série e possui um número sequencial dentro dela. A Série é exibida no identificador discreto do componente (ex.: "Capítulo 1 · Permanecer"). "Jornada Narrativa de Permanência" é o nome filosófico do mecanismo como um todo — não é uma entidade de domínio.
_Evitar_: tema, categoria, coleção, jornada (como entidade)

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
Comentários HTML e tags de fallback inseridas no `index.html` que são substituídos pelo script de prerendering com os valores reais de cada rota. Para evitar a ausência de títulos antes da hidratação do React, o `index.html` possui uma tag `<title>` estática de fallback, a qual é substituída em memória pelo placeholder `<!--META_TITLE-->` no início da pré-renderização para evitar a duplicação de tags de título nas páginas finais geradas.

**Notificação IndexNow**:
Mecanismo que notifica mecanismos de busca (como o Bing) sobre URLs novas ou atualizadas utilizando a API do IndexNow. Implementado em `scripts/indexnow-notify.ts` (para submissão de lista manual/core via `npm run indexnow:core`) e `scripts/indexnow-sitemap.ts` (para submissão em massa de todas as 5.027 URLs extraídas do sitemap via `npm run indexnow:sitemap`). Utiliza variáveis de ambiente `INDEXNOW_KEY` e `INDEXNOW_HOST` e aponta para o `keyLocation` da chave correspondente hospedada no Vercel.

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

### Controle de Áudio

**Controle de Reprodução Contínua**:
Opções de controle de áudio adicionadas aos players (Salmos, Harpa Cristã e Áudio Narrado da Bíblia) permitindo escolher entre repetir o áudio atual indefinidamente (Modo Repetir / Loop) ou avançar e reproduzir automaticamente o próximo capítulo ou hino ao término do atual (Modo Avanço Automático / Auto-advance). Ambos os modos são mutuamente exclusivos.

## Léxico Hebraico

**Léxico de Enriquecimento**:
Camada adicional de dados lexicográficos hebraicos integrada ao painel de estudo, proveniente do OpenScriptures HebrewLexicon. Complementa os dados do Strong's sem substituí-los.
_Evitar_: léxico alternativo, léxico completo, substituição do Strong's

**Pipeline de Conversão**:
Script offline TypeScript (`scripts/build-hebrew-lexicon.ts`) que parseia os XMLs do OpenScriptures e gera o arquivo `public/data/strongs_hebrew_os.json`. Executado manualmente por desenvolvedores, não faz parte do build da aplicação.
_Evitar_: script de build, script de CI, script de geração automática

**Raiz Trilítere**:
Texto hebraico da raiz morfológica de uma palavra, exibido na aba Língua como contexto educativo. Inferida do `LexicalIndex.xml`; omitida se não houver confiança suficiente.
_Evitar_: raiz Strong, raiz pai, número da raiz

**Família Lexical**:
Grupo semântico ao qual uma palavra hebraica pertence, representado pelo sentido em inglês da entrada raiz no `LexicalIndex.xml` (ex.: "perish", "father"). O rótulo na UI é localizado; o valor permanece em inglês.
_Evitar_: grupo de palavras, família semântica, categoria

**Resumo BDB**:
Texto compacto (250–400 chars) extraído do primeiro sentido principal da entrada no Brown-Driver-Briggs Lexicon. Representa um preview lexicográfico de alto valor para o leitor, não uma transcrição acadêmica completa.
_Evitar_: BDB completo, definição BDB, comentário lexical

**Tags de Uso**:
Lista curta (máx. 6–8 itens) de termos lexicográficos normalizados, extraídos do campo `<usage>` do `HebrewStrong.xml`, exibidos como chips na UI. Descrevem os usos canônicos da palavra.
_Evitar_: glossário de uso, sinônimos, lista de ocorrências

**Accordion Lexical**:
Componente de expansão "Ver mais ▾" no card da aba Língua que revela os campos de enriquecimento (Raiz, Família Lexical, Tags de Uso, Resumo BDB). Inicia fechado por padrão para preservar a experiência de leitura rápida.
_Evitar_: detalhes expandidos, painel avançado, modo especialista

## PWA e Cache Offline

**Operação Rocha Offline**:
Estratégia de disponibilidade offline e gestão de cache em PWA baseada em Workbox Cache-First. Precacheia os 66 livros da versão ACF (Rocha) e o App Shell no download inicial, utiliza CacheFirst e StaleWhileRevalidate com ExpirationPlugin para dados dinâmicos e isola mídias de áudio (Pass-Through) para impedir inchaço de armazenamento.
_Evitar_: offline genérico, cache total, PWA sem controle

## Flagged ambiguities

- "streak" aparece no código em `useReadingPlan.ts` como nome da variável para `completedDays.length`. O conceito de domínio é **Dias Concluídos**; "streak" é apenas o nome técnico da variável.
- "Bíblia Vive Leitura" aparece no nome do repositório por razão histórica; o nome canônico do produto é **Bíblia Vive**.
- "léxico hebraico" pode referir-se ao `strongs_hebrew.json` original (Strong's) ou ao novo `strongs_hebrew_os.json` (OpenScriptures). Usar **Léxico de Enriquecimento** para o novo e **Léxico Strong's** para o original.

