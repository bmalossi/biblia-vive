# Objetivo

Corrigir a experiência da aba **"Língua"** do `StudyPanel` para que leitores em **PT-BR** vejam não apenas a interface, mas também o **conteúdo lexical principal em português**, sem perder a base técnica em inglês para leitores internacionais.

Hoje a interface já está localizada, mas o valor principal da experiência — família lexical, usos e resumo BDB — continua em inglês em muitos casos. Isso gera uma experiência inconsistente e pouco agradável para o público brasileiro.

A nova direção é:

- **PT-BR:** conteúdo lexical principal em português
- **EN:** conteúdo lexical em inglês
- **ES:** manter suporte de interface, mas pode usar fallback parcial até existir tradução curada suficiente
- **Fallback técnico:** quando não houver tradução segura, mostrar o original em inglês de forma secundária, não como conteúdo principal

---

# Diretriz de produto

Para leitores brasileiros, a aba “Língua” deve parecer uma ferramenta de estudo realmente feita para eles.

Isso significa:

1. **Significado principal em português**
2. **Família lexical em português**
3. **Usos em português**
4. **Resumo BDB em português**
5. **Original inglês como apoio técnico opcional, não como conteúdo dominante**

Não quero uma experiência “meio traduzida”.
Não quero apenas traduzir labels da interface.
Quero que o conteúdo lexical importante seja localizado para PT-BR.

---

# Estratégia técnica

## Princípio

Não depender apenas de tradução no frontend.

Em vez disso:
- manter o dataset técnico original
- enriquecer o pipeline para produzir campos localizados
- o frontend escolhe quais campos exibir com base no locale

## Estrutura desejada

Expandir a estrutura do léxico hebraico enriquecido para suportar campos localizados, por exemplo:

```ts
{
  number: "H5921",
  word: "עַל",
  translit: "'al",
  definition: "above, over, against...",
  definition_pt: "acima, sobre, contra...",
  definition_es: "...",

  root: "עלה",

  word_group: "Go Up",
  word_group_pt: "Subir / Elevar-se",
  word_group_es?: string,

  usage_tags: ["above", "according to", "after", "against"],
  usage_tags_pt: ["acima", "conforme", "depois", "contra"],
  usage_tags_es?: string[],

  bdb_short: "subst. height",
  bdb_short_pt: "substantivo: altura / elevação",
  bdb_short_es?: string
}
```

Os campos em inglês continuam existindo como fonte técnica original.
Os campos em português passam a ser a fonte principal da UI em PT-BR.

---

# Escopo da implementação

## 1. Pipeline de enriquecimento

Atualizar o pipeline que gera `strongs_hebrew_os.json` para também produzir campos localizados.

### Arquivo-alvo
- `scripts/build-hebrew-lexicon.ts`

### Objetivo
Durante a geração do JSON final:
- preservar os campos originais em inglês
- gerar versões PT-BR para os campos principais da experiência lexical

### Campos a localizar
- `word_group_pt`
- `usage_tags_pt`
- `bdb_short_pt`

### Regras
- usar tradução curada / segura
- não usar tradução literal ingênua para termos ambíguos
- se não houver tradução segura, omitir o campo localizado em vez de inventar

---

## 2. Estratégia por campo

### `definition_pt`
- manter como já existe hoje
- preservar merge do arquivo legado atual

### `word_group_pt`
- traduzir o gloss lexical para uma forma curta e natural em português
- precisa ser legível para usuário comum
- manter valor técnico enxuto

Exemplos:
- `Go Up` → `Subir / Elevar-se`
- `Fear` → `Temer / Reverenciar`
- `Perish` → `Perecer / Ser destruído`

### `usage_tags_pt`
- traduzir chips para português curto
- manter 1–3 palavras por chip
- máximo de 6–8 chips por entrada
- se algum chip for ambíguo ou ruim em português, omitir ou manter apenas os melhores

Exemplos:
- `above` → `acima`
- `according to` → `conforme`
- `after` → `depois`
- `against` → `contra`

### `bdb_short_pt`
- traduzir o resumo compacto BDB para português natural
- manter o mesmo espírito do resumo original: curto, técnico e legível
- alvo ideal: 200–350 caracteres
- máximo absoluto: 400 caracteres
- se não houver tradução curada suficiente, omitir `bdb_short_pt`

Importante:
- `bdb_short_pt` deve soar como resumo de estudo bíblico, não como tradução automática quebrada

---

## 3. Frontend

### Arquivo-alvo
- `src/components/StudyPanel.tsx`

### Regras de exibição por locale

#### Se locale for PT-BR
Exibir prioritariamente:
- `definition_pt`
- `word_group_pt`
- `usage_tags_pt`
- `bdb_short_pt`

Fallback:
- se algum campo `_pt` não existir, usar o original em inglês de forma discreta

#### Se locale for EN
Exibir:
- `definition`
- `word_group`
- `usage_tags`
- `bdb_short`

#### Se locale for ES
- pode usar `definition_es` quando existir
- para os novos campos, usar `_es` quando existir
- caso contrário, fallback para inglês

### Regras visuais
- não exibir badge “fonte em inglês” em excesso
- usar fallback em inglês apenas quando necessário
- quando houver fallback, ele deve parecer secundário, não o conteúdo principal

---

## 4. Modelo de fallback

Implementar lógica semelhante a:

```ts
const lexicalFamily =
  locale.startsWith('pt') ? (entry.word_group_pt || entry.word_group) :
  locale.startsWith('es') ? (entry.word_group_es || entry.word_group) :
  entry.word_group;

const lexicalUsages =
  locale.startsWith('pt') ? (entry.usage_tags_pt || entry.usage_tags) :
  locale.startsWith('es') ? (entry.usage_tags_es || entry.usage_tags) :
  entry.usage_tags;

const lexicalBdb =
  locale.startsWith('pt') ? (entry.bdb_short_pt || entry.bdb_short) :
  locale.startsWith('es') ? (entry.bdb_short_es || entry.bdb_short) :
  entry.bdb_short;
```

---

## 5. Tipagem

### Arquivo-alvo
- `src/lib/strongs.ts`

Expandir `StrongsEntry` para suportar:

```ts
word_group_pt?: string;
word_group_es?: string;
usage_tags_pt?: string[];
usage_tags_es?: string[];
bdb_short_pt?: string;
bdb_short_es?: string;
```

Sem remover os campos existentes.

---

## 6. Qualidade de tradução

Não quero tradução genérica de máquina aplicada cegamente em todo o dataset.

Quero uma abordagem segura:

- usar mapeamentos curados para termos lexicais comuns
- usar tradução automatizada somente se houver revisão ou heurística forte
- se o resultado parecer ruim, prefiro campo omitido a tradução ruim

Prioridade:
1. PT-BR com boa qualidade
2. EN intacto
3. ES como evolução posterior / fallback parcial

---

## 7. UX desejada

Para um usuário brasileiro, o painel deve ficar parecido com isto:

- **Raiz:** עלה
- **Família lexical:** Subir / Elevar-se
- **Usos:** acima, conforme, depois, contra
- **Resumo BDB:** substantivo relacionado a altura, elevação ou movimento ascendente...

E não assim:
- `Go Up`
- `above / according to / after`
- `source in English`

O inglês pode existir como apoio técnico, mas não pode ser o conteúdo dominante para PT-BR.

---

## 8. Testes

Criar ou atualizar testes para garantir:

### Pipeline
- gera corretamente `word_group_pt`
- gera corretamente `usage_tags_pt`
- gera corretamente `bdb_short_pt`
- preserva campos originais
- preserva `definition_pt`

### Frontend
- PT-BR usa campos `_pt` quando disponíveis
- EN usa campos originais
- fallback funciona sem quebrar layout

### Type safety
- rodar:
```bash
npx tsc --noEmit
```

---

# Critério de sucesso

A implementação será considerada correta quando:

1. Um usuário em PT-BR vê o conteúdo lexical principal em português
2. O painel deixa de parecer “meio traduzido”
3. O inglês continua disponível para leitores em inglês
4. O JSON permanece tecnicamente consistente
5. O fallback funciona bem quando não houver tradução localizada

---

# Entregáveis

1. Atualização do pipeline de geração do léxico hebraico
2. Novo JSON com campos localizados em PT-BR
3. Tipos atualizados em `StrongsEntry`
4. `StudyPanel.tsx` usando os campos localizados por locale
5. Testes cobrindo geração e renderização com fallback
6. Breve documentação explicando a política de localização lexical

---

# Instrução final

Não resolva isso apenas com labels de interface.

Resolva isso com **conteúdo lexical localizado de verdade para PT-BR**, mantendo o inglês como fonte técnica e como experiência principal apenas para usuários em inglês.