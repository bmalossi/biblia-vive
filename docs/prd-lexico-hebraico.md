# PRD: Léxico de Enriquecimento Hebraico (OpenScriptures)

## Problem Statement

O Leitor que usa a aba "Língua" do painel de estudo para pesquisar palavras hebraicas recebe apenas uma definição curta em inglês (com tradução PT-BR quando disponível) e a transliteração. Não há informação sobre a raiz da palavra, a família lexical a que pertence, os usos canônicos do termo ou um resumo da análise filológica clássica.

Isso limita o valor educativo da aba "Língua" para leitores com interesse em aprofundamento: eles não conseguem entender como a palavra se conecta ao seu grupo semântico, nem ter uma visão rápida do que lexicógrafos históricos como Brown-Driver-Briggs concluíram sobre ela.

O Bíblia Vive perde uma oportunidade de diferenciação clara frente a aplicativos bíblicos básicos — que também oferecem uma definição simples do Strong's.

## Solution

Integrar o **Léxico de Enriquecimento** baseado no OpenScriptures HebrewLexicon como camada adicional de dados lexicográficos para palavras hebraicas no painel de estudo, sem remover nem alterar o comportamento atual.

A solução funciona em duas partes:

1. **Pipeline de Conversão offline**: um script TypeScript executado por desenvolvedores converte os arquivos XML do OpenScriptures em um arquivo JSON estático otimizado para o frontend, mesclando as traduções PT-BR já existentes no projeto.

2. **Accordion Lexical na aba "Língua"**: os novos campos enriquecidos são exibidos em um componente expansível "Ver mais ▾" no card da palavra selecionada. O card existente (significado rápido) não muda. O Leitor acessa profundidade lexical por demanda, sem sobrecarga visual.

## User Stories

**Leitor estudando palavras hebraicas:**

1. Como um Leitor estudando um versículo do Antigo Testamento, quero ver a raiz trilítere hebraica da palavra selecionada, para que eu entenda de qual raiz morfológica aquela palavra deriva.
2. Como um Leitor, quero ver a qual família lexical uma palavra hebraica pertence, para que eu consiga conectá-la a outras palavras com a mesma origem semântica.
3. Como um Leitor, quero ver uma lista de usos canônicos de uma palavra hebraica como chips visuais, para que eu compreenda rapidamente em quais contextos aquela palavra aparece na Bíblia.
4. Como um Leitor com interesse em aprofundamento, quero expandir um accordion para acessar um resumo compacto do Brown-Driver-Briggs Lexicon, para que eu tenha acesso a uma perspectiva filológica clássica sem sair da plataforma.
5. Como um Leitor que usa o painel para leitura rápida, quero que os campos de enriquecimento fiquem ocultos por padrão, para que o card não fique visualmente carregado quando não preciso de profundidade.
6. Como um Leitor que estuda em PT-BR, quero que todos os rótulos dos novos campos sejam em português, para que eu entenda o que cada seção representa.
7. Como um Leitor, quero que o accordion "Ver mais" apareça apenas quando existem dados de enriquecimento disponíveis para aquela palavra, para não ver um botão vazio.
8. Como um Leitor, quero que os campos de significado, transliteração e ocorrências continuem exatamente como antes, para não perder a experiência de leitura rápida que já conheço.
9. Como um Leitor, quero que o hover e a seleção de palavras no texto hebraico original continuem funcionando da mesma forma, para que a interação não seja quebrada.
10. Como um Leitor, quero que os usos canônicos apareçam como chips individuais e legíveis, com no máximo 6–8 chips por palavra, para que sejam escaneáveis e não virem um bloco de texto.
11. Como um Leitor Pro ou Gratuito, quero ter acesso ao enriquecimento lexical sem restrição de plano, para que o valor educativo seja acessível a todos.

**Desenvolvedor mantendo o projeto:**

12. Como um Desenvolvedor, quero um script offline documentado para regenerar o JSON do léxico hebraico a partir dos XMLs do OpenScriptures, para que eu possa atualizar os dados quando necessário sem impactar o build da aplicação.
13. Como um Desenvolvedor, quero que o script de conversão preserve automaticamente as traduções PT-BR já existentes no projeto, para que nenhuma tradução seja perdida durante a migração.
14. Como um Desenvolvedor, quero que os novos campos do tipo `StrongsEntry` sejam opcionais, para que entradas sem dados de enriquecimento não quebrem o código existente.
15. Como um Desenvolvedor, quero que o loader grego (`loadGreek`) não seja alterado, para que o painel de estudo do Novo Testamento não seja afetado.
16. Como um Desenvolvedor, quero documentação clara sobre a licença e atribuição do OpenScriptures, para garantir conformidade legal no uso dos dados.

## Implementation Decisions

### Módulos

**Módulo A — HebrewLexiconParser (script offline)**
- Script TypeScript executado manualmente via `npx tsx`
- Parseia três XMLs em sequência: `HebrewStrong.xml` (dados principais), `LexicalIndex.xml` (hierarquia de raízes), `BrownDriverBriggs.xml` (análise filológica)
- Faz merge de `definition_pt` e `definition_es` do arquivo JSON atual do projeto, por chave Strong
- Produz um único arquivo JSON estático com todas as entradas hebraicas enriquecidas
- Não faz parte do pipeline de build da aplicação

**Módulo B — Tipo StrongsEntry (contrato de dados)**
- Extensão aditiva do tipo existente: quatro novos campos opcionais (`root`, `word_group`, `usage_tags`, `bdb_short`)
- Nenhum campo existente é removido ou alterado
- Callers existentes de `getStrongsEntry()` continuam funcionando sem modificação

**Módulo C — loadHebrew() (loader)**
- Única mudança: URL de fetch aponta para o novo arquivo JSON gerado
- API pública de `getStrongsEntry()` permanece idêntica
- Cache em memória preservado sem alteração

**Módulo D — LexicalEnrichmentAccordion (componente de UI)**
- Componente novo inserido no card de palavra selecionada na aba "Língua"
- Inicia fechado por padrão
- Renderiza apenas quando ao menos um dos campos de enriquecimento está presente
- Seções internas são individualmente opcionais: `root` ("Raiz"), `word_group` ("Família lexical"), `usage_tags` ("Usos" — chips), `bdb_short` ("Resumo BDB")

### Decisões técnicas

- **Chave do JSON**: formato `H1`, `H7586` sem zero-padding — compatível com o padrão atual
- **`root`**: texto hebraico trilítere extraído da hierarquia do `LexicalIndex.xml`; omitido se não houver confiança
- **`word_group`**: valor mantido em inglês (fonte primária); apenas o rótulo na UI é localizado em PT-BR. Exemplo: "Família lexical: perish"
- **`bdb_short`**: extraído do primeiro `<sense>` principal do BDB, texto limpo (sem tags XML, sem `†`, `√`, sem referências cruzadas), alvo 250–300 chars, máximo absoluto 400 chars, truncado com `…`
- **`usage_tags`**: split por vírgula e ponto e vírgula, remoção de ruído (`×`, `Compare...`, `See...`, parênteses excessivos), descarte de tokens com mais de ~40 chars, limite de 6–8 tags por entrada
- **Merge de traduções**: `definition_pt` e `definition_es` do `strongs_hebrew.json` atual são preservados no novo JSON via merge por chave Strong; entradas sem correspondência ficam sem tradução
- **Aramaic**: entradas aramaicas presentes no `LexicalIndex.xml` são processadas com as mesmas regras do hebraico
- **Loader grego**: sem alterações

## Testing Decisions

### O que faz um bom teste neste contexto

Testar apenas o comportamento externo do módulo, não os detalhes de implementação do parsing interno. Um bom teste verifica o que entra e o que sai — não como o XML é percorrido internamente.

### Módulo testado: HebrewLexiconParser

Testes unitários via Vitest para as funções de normalização e extração do pipeline, usando fragmentos reais dos XMLs como fixtures:

- **Normalização de `usage_tags`**: dado um valor de `<usage>` com ruído (`×`, parênteses, notas "Compare"), a função retorna um array limpo com no máximo 6–8 tokens de até ~40 chars
- **Extração de `root`**: dado um fragmento do `LexicalIndex.xml` com hierarquia `sub → main`, a função retorna o texto hebraico correto da raiz; dado uma entrada sem parent, retorna `undefined`
- **Geração de `bdb_short`**: dado um fragmento do `BrownDriverBriggs.xml`, a função retorna texto limpo dentro do limite de 400 chars, com `…` no final quando truncado
- **Merge de traduções**: dado um registro OpenScriptures e um registro do arquivo atual com `definition_pt`, o resultado contém o campo `definition_pt` do arquivo atual preservado

### Prior art

O projeto usa Vitest (`vitest.config.ts`). Os testes seguem o padrão de módulos isolados. A pasta `tests/` está atualmente vazia — estes seriam os primeiros testes do projeto.

## Out of Scope

- Tradução automática do campo `word_group` para PT-BR
- Enriquecimento do léxico grego (Novo Testamento) — apenas hebraico nesta sprint
- Interface de administração para editar os dados do léxico
- Sincronização automática com atualizações do repositório OpenScriptures
- Campo `pronunciation` (presente no arquivo atual, não incluído no tipo nem no novo JSON)
- Campo `occurrences` (não disponível nos XMLs do OpenScriptures)
- Filtro ou busca por `usage_tags` ou `word_group` na UI
- Modo expandido persistente entre sessões (accordion sempre reinicia fechado)

## Further Notes

**Licença**: O OpenScriptures HebrewLexicon é licenciado sob Creative Commons Attribution 4.0 (CC BY 4.0). A atribuição deve ser incluída em `docs/lexicon-hebrew.md` e em local visível da aplicação se os dados forem expostos publicamente.

**Regeneração dos dados**: Os XMLs do OpenScriptures não devem ser versionados no repositório (tamanho total ~7.5MB). A pasta `scripts/data/openscriptures/` deve estar no `.gitignore`. O `docs/lexicon-hebrew.md` deve incluir instruções sobre como baixar os XMLs e executar o script.

**Impacto no bundle**: O novo arquivo `strongs_hebrew_os.json` substitui o `strongs_hebrew.json` atual. Como é carregado de forma assíncrona e em cache, não há impacto no tempo de carregamento inicial da aplicação.

**Cobertura parcial**: Nem todas as entradas do Strong's hebraico terão dados de enriquecimento completos. Isso é esperado e tratado pela opcionalidade dos campos — a UI simplesmente não exibe seções sem dados.
