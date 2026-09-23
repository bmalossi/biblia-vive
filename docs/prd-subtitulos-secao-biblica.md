# PRD — Subtítulos de Seção Bíblica

---

## Problem Statement

A tela de leitura bíblica da Bíblia Vive exibe os versículos de cada capítulo como uma sequência contínua e indiferenciada de texto. As Bíblias físicas e digitais de referência — incluindo a própria NVI impressa — organizam o texto em seções nomeadas com subtítulos editoriais (ex: "O Princípio", "A Origem da Humanidade", "O Nascimento de Jesus Cristo") que orientam o Leitor dentro da estrutura narrativa, poética ou doutrinária do capítulo. Sem esses marcadores, o Leitor perde o mapa interno do texto e precisa recorrer a fontes externas para entender a divisão temática do que está lendo.

---

## Solution

Extrair automaticamente os subtítulos de seção do PDF da NVI (Bíblia Nova Versão Internacional em português) via script Python, identificando-os pela assinatura tipográfica única no documento. O resultado é armazenado como JSON estático versionado no repositório. No frontend, um hook React carrega esse JSON e fornece para a tela de leitura (`ReadingPage`) os subtítulos relevantes para o capítulo atual. Os subtítulos são renderizados inline entre os versículos — exatamente onde aparecem no impresso — usando tipografia discreta em uppercase com fonte ligeiramente maior que o corpo do texto. Os subtítulos da NVI servem como padrão para todas as versões em português (pt-br). Versões em outros idiomas exibem silêncio absoluto enquanto não houver dados de subtítulos para aquele idioma.

---

## User Stories

1. Como Leitor lendo Gênesis 1 na versão NVI, quero ver o subtítulo "O PRINCÍPIO" antes do versículo 1, para que eu saiba imediatamente o tema da abertura do texto.
2. Como Leitor lendo Gênesis 2 na versão NVI, quero ver o subtítulo "A ORIGEM DA HUMANIDADE" entre os versículos 3 e 4, para que eu perceba a transição narrativa sem precisar consultar uma fonte externa.
3. Como Leitor lendo Mateus 1 na versão NVI, quero ver "A GENEALOGIA DE JESUS" antes do versículo 1 e "O NASCIMENTO DE JESUS CRISTO" antes do versículo 18, para que eu acompanhe a estrutura editorial do capítulo.
4. Como Leitor lendo Apocalipse 22 na versão NVI, quero ver "O RIO DA VIDA" antes do versículo 1 e "JESUS VEM EM BREVE" antes do versículo 6 ou 7, para que eu navegue com clareza pelas seções finais da Escritura.
5. Como Leitor usando a versão ACF, ARC, KJA ou AA (pt-br), quero que os subtítulos da NVI apareçam normalmente, para que eu tenha orientação de seção mesmo nessas versões enquanto dados próprios não estão disponíveis.
6. Como Leitor usando a versão KJV ou BBE (inglês), quero que nenhum subtítulo seja exibido, para que a interface não misture idiomas de forma inconsistente.
7. Como Leitor usando a versão RVR (espanhol), quero que nenhum subtítulo seja exibido, para que a experiência de leitura seja coerente com o idioma da versão.
8. Como Leitor rolando o capítulo, quero encontrar os subtítulos naturalmente no fluxo de leitura — inline entre os versículos — sem precisar interagir com nenhum elemento extra ou índice no topo.
9. Como Leitor que ajustou o tamanho da fonte nas preferências de leitura, quero que o subtítulo cresça proporcionalmente junto com o texto bíblico, para que a hierarquia visual seja sempre preservada.
10. Como Leitor no modo de comparação entre duas versões pt-br, quero que o subtítulo apareça em cada coluna de forma independente, para que quando futuras versões com subtítulos diferentes forem adicionadas, cada coluna exiba o correto.
11. Como Leitor no modo de comparação entre uma versão pt-br e uma versão em inglês, quero que a coluna pt-br exiba os subtítulos e a coluna inglesa permaneça sem subtítulos, para que a experiência seja consistente com a regra de idioma.
12. Como Leitor no Modo Clausura (imersão total), quero que os subtítulos continuem visíveis inline no texto, para que a orientação de seção não desapareça durante a meditação.
13. Como Leitor ouvindo o Text-to-Speech (TTS) do capítulo, quero que os subtítulos estejam presentes na tela enquanto o áudio é narrado, para que eu acompanhe visualmente a seção que está sendo lida.
14. Como Visitante (sem conta) lendo qualquer capítulo em pt-br, quero ver os subtítulos normalmente, para que o recurso de orientação bíblica esteja disponível independente de autenticação.
15. Como Leitor Pro usando o modo foco (`focusMode`), quero que os subtítulos permaneçam visíveis no texto bíblico, pois fazem parte do conteúdo e não da interface periférica.
16. Como Leitor offline sem conexão à internet, quero que os subtítulos continuem aparecendo (pois o JSON está no bundle estático do app), para que a experiência offline seja completa.

---

## Implementation Decisions

### Extração de dados

- Os subtítulos são identificados no PDF da NVI pela assinatura tipográfica **Arial-BoldMT, tamanho 11pt** — assinatura única nesse documento, sem ambiguidade com outros elementos visuais.
- Os cabeçalhos de capítulo são identificados por **Georgia-Bold, 14pt** (ex: "Gênesis 1", "Mateus 1").
- A posição vertical de cada subtítulo na página é usada para inferir o `before_verse`: o número do primeiro versículo que aparece depois do subtítulo naquela página define o valor de `before_verse`.
- O script Python produz um JSON com a estrutura:
  ```json
  {
    "gn": {
      "1": [{ "before_verse": 1, "text": "O Princípio" }],
      "2": [
        { "before_verse": 1, "text": "..." },
        { "before_verse": 4, "text": "A Origem da Humanidade" }
      ]
    }
  }
  ```
- O `before_verse: 1` é usado uniformemente para subtítulos que aparecem no início do capítulo — sem lógica especial de "primeiro subtítulo".
- O nome de cada livro no PDF é mapeado para o slug interno do projeto (ex: "Gênesis" → `gn`, "Mateus" → `mt`, "Apocalipse" → `re`).
- O script é executado uma única vez pelo desenvolvedor; o JSON resultante é commitado no repositório.

### Armazenamento

- O JSON é armazenado em `public/bible/subtitles/nvi-pt-br.json` — ao lado dos demais dados estáticos da Bíblia já existentes no projeto.
- Nenhuma tabela de banco de dados é criada. Nenhum endpoint de API é necessário.
- O arquivo é elegível para cache pelo Service Worker já existente no projeto.

### Módulo de dados (lib)

- Um módulo de biblioteca encapsula o carregamento e consulta do JSON.
- O JSON é carregado via `fetch` uma única vez (singleton) — chamadas subsequentes ao mesmo capítulo são servidas do cache em memória sem nova requisição de rede.
- A interface pública principal é `getHeadingsForChapter(bookSlug, chapter, langCode)` retornando `SectionHeading[]`.
- Quando `langCode` não começa com `"pt"`, a função retorna imediatamente `[]` sem carregar o JSON.
- Se o fetch falhar (offline, erro de rede), a função retorna `[]` sem lançar exceção — o texto bíblico continua sendo exibido normalmente.
- O tipo central: `SectionHeading { before_verse: number; text: string }`.

### Hook React

- Um hook `useSectionHeadings(bookSlug, chapter, lang)` expõe os dados para componentes React.
- O hook retorna o array de headings e uma função auxiliar `getHeadingsBeforeVerse(verseNum: number): SectionHeading[]` que filtra os headings relevantes para cada versículo durante o render.

### Renderização na tela de leitura

- A renderização ocorre na `ReadingPage`, dentro dos dois loops de versículos existentes: o da coluna principal e o da coluna de comparação.
- Para cada versículo, antes de renderizar seu conteúdo, `getHeadingsBeforeVerse(verse.number)` é chamado; se retornar headings, eles são renderizados imediatamente acima do versículo.
- O componente de subtítulo é um elemento de parágrafo com as classes: `font-serif`, `uppercase`, `tracking-widest`, `text-app-text-muted`, tamanho `calc(var(--font-size-reading) * 1.05)` — proporcional às preferências de leitura do usuário.
- Sem linha divisória acima ou abaixo — o espaçamento de margem superior (`mt-6`) é suficiente para criar separação visual entre seções.
- A coluna de comparação usa o lang da versão em comparação para decidir se exibe subtítulos ou não.

---

## Testing Decisions

- **O que testa um bom teste aqui:** o comportamento externo observável é "dado um livro, capítulo e lang, quais subtítulos aparecem e em qual posição". Não se testa a implementação interna do fetch ou do cache.
- **Módulo lib:** testes unitários para `getHeadingsForChapter` com dados mockados — verificando que retorna `[]` para lang não-pt, retorna os subtítulos corretos para capítulos com dados, e retorna `[]` silenciosamente em caso de falha de fetch.
- **Função auxiliar:** testes para `getHeadingsBeforeVerse` confirmando que agrupa corretamente os headings pelo número de versículo.
- **Prior art no projeto:** os testes unitários existentes em `src/tests/` e `src/test/` são a referência de estrutura e estilo — especialmente os testes de `scriptureThread` que testam lógica de dados assíncronos mockados.

---

## Out of Scope

- Subtítulos para versões em inglês (BBE, KJV) ou espanhol (RVR) — não há PDF dessas versões disponível.
- Edição de subtítulos via painel administrativo — os dados são estáticos em JSON; edição futura requer commit no repositório.
- Subtítulos para a versão em língua original (hebraico/grego) — o conteúdo serve fins de estudo acadêmico e os subtítulos não fazem sentido semântico nesse contexto.
- Exibição de subtítulos no componente `ChurchDisplayPage` (projetor do Modo Igreja) — fora do escopo desta entrega.
- Subtítulos em resultados de busca (`SearchPage`) — os resultados são versículos individuais sem contexto de seção.
- Subtítulos no widget de Versículo do Dia (`WidgetDailyVerse`) — não há contexto de capítulo completo nessa UI.
- Atualização automática dos subtítulos quando um novo PDF for fornecido — o script precisa ser executado manualmente pelo desenvolvedor.

---

## Further Notes

- O PDF da NVI contém 2.649 páginas e cobre os 66 livros canônicos com subtítulos em todos os capítulos que possuem divisões editoriais na edição impressa.
- A assinatura tipográfica `Arial-BoldMT / 11pt` foi verificada empiricamente nas primeiras 50 páginas do PDF — inclui confirmação dos exemplos específicos citados: "O Princípio" (Gn 1), "A Origem da Humanidade" (Gn 2), "O Relato da Queda" (Gn 3), "A Genealogia de Jesus" (Mt 1).
- O projeto já possui Service Worker com estratégia de cache — o arquivo `nvi-pt-br.json` será cacheado automaticamente sem configuração adicional.
- Esta feature não requer migração de banco de dados, novo endpoint de API, ou alteração de schema Supabase — impacto operacional zero.
- Versões futuras (ex: PDF da ARC, KJA, KJV em inglês) podem ser incorporadas adicionando novos arquivos `arc-pt-br.json`, `kjv-en.json` etc. e ajustando a lógica de resolução no módulo lib.
