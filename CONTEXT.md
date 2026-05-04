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

## Flagged ambiguities

- "streak" aparece no código em `useReadingPlan.ts` como nome da variável para `completedDays.length`. O conceito de domínio é **Dias Concluídos**; "streak" é apenas o nome técnico da variável.
- "Bíblia Vive Leitura" aparece no nome do repositório por razão histórica; o nome canônico do produto é **Bíblia Vive**.
