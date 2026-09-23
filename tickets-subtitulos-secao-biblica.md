# Tickets: Subtítulos de Seção Bíblica

Implementação dos subtítulos editoriais inline na tela de leitura, extraídos do PDF da NVI e renderizados entre os versículos. Fonte: `docs/prd-subtitulos-secao-biblica.md`.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

---

## 1. Script de Extração PDF → JSON Estático

**What to build:** O desenvolvedor executa um script Python que abre o PDF da NVI, identifica subtítulos pela assinatura tipográfica única (`Arial-BoldMT, 11pt`) e cabeçalhos de capítulo (`Georgia-Bold, 14pt`), infere o `before_verse` de cada subtítulo pela posição vertical relativa aos números de versículo na mesma página, mapeia os nomes dos livros para os slugs internos do projeto, e gera `public/bible/subtitles/nvi-pt-br.json` cobrindo os 66 livros. O JSON resultante é commitado no repositório como dado estático.

**Blocked by:** None — can start immediately.

- [x] O script roda sem erros sobre o PDF `Biblia NVI.pdf` e produz um JSON válido.
- [x] O JSON contém `"gn": { "1": [{ "before_verse": 1, "text": "O Princípio" }] }`.
- [x] O JSON contém `"gn": { "2": [..., { "before_verse": 4, "text": "A Origem da Humanidade" }] }`.
- [x] O JSON contém `"mt": { "1": [{ "before_verse": 1, "text": "A Genealogia de Jesus" }, { "before_verse": 18, "text": "O Nascimento de Jesus Cristo" }] }`.
- [x] O JSON contém `"re": { "22": [{ "before_verse": 1, "text": "O Rio da Vida" }, { "before_verse": 6, "text": "Jesus Vem em Breve" }] }` (ou `before_verse: 7` conforme o PDF).
- [x] Todos os 66 livros canônicos estão representados no JSON (mesmo que alguns capítulos não tenham subtítulos — esses capítulos simplesmente não aparecem no JSON).
- [x] O arquivo é salvo em `public/bible/subtitles/nvi-pt-br.json`.

---

## 2. Módulo de Dados e Hook React

**What to build:** Um módulo de biblioteca encapsula o carregamento e a consulta do JSON de subtítulos: carrega o arquivo uma única vez via `fetch` (singleton em memória), retorna silêncio (`[]`) para qualquer lang que não comece com `"pt"`, e retorna silêncio sem exceção em caso de falha de rede. Um hook React expõe os dados para a tela de leitura com uma função auxiliar que filtra os subtítulos relevantes para cada número de versículo. A camada de dados é coberta por testes unitários com JSON mockado.

**Blocked by:** 1. Script de Extração PDF → JSON Estático.

- [x] `getHeadingsForChapter("gn", 2, "pt-BR")` retorna `[{ before_verse: 1, ... }, { before_verse: 4, text: "A Origem da Humanidade" }]`.
- [x] `getHeadingsForChapter("gn", 2, "en")` retorna `[]` sem realizar nenhum fetch.
- [x] `getHeadingsForChapter("gn", 2, "es")` retorna `[]` sem realizar nenhum fetch.
- [x] Chamar `getHeadingsForChapter` duas vezes com os mesmos parâmetros resulta em exatamente um fetch de rede (cache singleton).
- [x] Se o fetch falha (rede offline ou 404), a função retorna `[]` e não lança exceção.
- [x] `getHeadingsBeforeVerse(4)` sobre o resultado de Gênesis 2 retorna `[{ before_verse: 4, text: "A Origem da Humanidade" }]`.
- [x] `getHeadingsBeforeVerse(3)` sobre o mesmo resultado retorna `[]`.
- [x] Os testes unitários passam sem conexão de rede (JSON mockado).

---

## 3. Renderização Inline na Coluna Principal

**What to build:** A coluna principal da tela de leitura exibe os subtítulos de seção inline entre os versículos, para todas as versões em português (pt-br). O Leitor que abre Gênesis 2 vê "A ORIGEM DA HUMANIDADE" entre os versículos 3 e 4, sem clicar em nada, sem índice no topo — o subtítulo aparece naturalmente durante a rolagem. O visual é discreto: uppercase, `font-serif`, tamanho proporcional à preferência de leitura do usuário, sem linha divisória. Versões em inglês e espanhol exibem silêncio absoluto.

**Blocked by:** 2. Módulo de Dados e Hook React.

- [x] Abrir Gênesis 1 (NVI) na tela de leitura: o subtítulo aparece antes do versículo 1.
- [x] Abrir Gênesis 2 (NVI): o subtítulo "A ORIGEM DA HUMANIDADE" aparece entre os versículos 3 e 4.
- [x] Abrir Mateus 1 (NVI): "A GENEALOGIA DE JESUS" aparece antes do versículo 1 e "O NASCIMENTO DE JESUS CRISTO" antes do versículo 18.
- [x] Abrir Apocalipse 22 (NVI): "O RIO DA VIDA" antes do versículo 1 e "JESUS VEM EM BREVE" antes do versículo 6 ou 7.
- [x] Trocar para a versão ACF no mesmo capítulo: os subtítulos da NVI continuam sendo exibidos.
- [x] Trocar para a versão KJV (inglês): nenhum subtítulo é exibido.
- [x] Aumentar o tamanho da fonte nas preferências: o subtítulo cresce proporcionalmente.
- [x] O subtítulo é visível no Modo Clausura (não faz parte da interface periférica que desaparece).
- [x] O subtítulo é visível no `focusMode` (modo foco de leitura).

---

## 4. Renderização na Coluna de Comparação

**What to build:** A coluna de comparação da tela de leitura exibe seus próprios subtítulos de forma independente da coluna principal, com base no lang da versão em comparação. Quando o Leitor compara NVI × ACF, cada coluna exibe os subtítulos (ambas são pt-br). Quando compara NVI × KJV, a coluna KJV fica sem subtítulos.

**Blocked by:** 3. Renderização Inline na Coluna Principal.

- [x] Ativar comparação NVI × ACF em Mateus 1: ambas as colunas exibem "A GENEALOGIA DE JESUS" antes do versículo 1 e "O NASCIMENTO DE JESUS CRISTO" antes do versículo 18.
- [x] Ativar comparação NVI × ARC: ambas as colunas exibem os subtítulos.
- [x] Ativar comparação NVI × KJV: a coluna NVI exibe os subtítulos; a coluna KJV não exibe nenhum.
- [x] Os subtítulos da coluna de comparação são independentes dos da coluna principal — se futuramente o JSON `kjv-en.json` for adicionado, a coluna KJV passará a exibi-los sem alterar a coluna principal.

