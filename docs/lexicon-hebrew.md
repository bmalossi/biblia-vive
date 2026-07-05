# Documentação: Léxico Hebraico (OpenScriptures)

Este documento descreve a integração do OpenScriptures HebrewLexicon no Bíblia Vive como um léxico de enriquecimento para a aba "Língua".

## Origem dos Dados

Os dados originais foram obtidos do repositório OpenScriptures HebrewLexicon:
- GitHub: [openscriptures/HebrewLexicon](https://github.com/openscriptures/HebrewLexicon)

Arquivos XML utilizados:
1. **`HebrewStrong.xml`**: Fonte dos lemas hebraicos, transliterações, definições básicas e tags de uso (`<usage>`).
2. **`LexicalIndex.xml`**: Fonte para a resolução de raízes trilíteres (`root`) e grupos lexicais / famílias (`word_group`).
3. **`BrownDriverBriggs.xml`**: Fonte das análises filológicas que geram o resumo clássico do BDB (`bdb_short`).

## Pipeline de Conversão

Para evitar o parseamento de arquivos XML pesados no navegador (o que reduziria o desempenho e consumiria dados excessivos do usuário), um script offline converte os XMLs em um arquivo JSON estático unificado:

- **Localização do script**: `scripts/build-hebrew-lexicon.ts`
- **JSON gerado**: `public/data/strongs_hebrew_os.json`

### Instruções para Execução do Pipeline

Caso os dados originais no repositório OpenScriptures sejam atualizados ou novas traduções precisem ser mescladas:

1. Baixe os arquivos XML originais (`HebrewStrong.xml`, `LexicalIndex.xml`, `BrownDriverBriggs.xml`) do repositório [openscriptures/HebrewLexicon](https://github.com/openscriptures/HebrewLexicon).
2. Salve-os localmente no diretório `scripts/data/openscriptures/` (este diretório está configurado no `.gitignore` e não deve ser versionado).
3. Execute o script de conversão:
   ```bash
   npx tsx scripts/build-hebrew-lexicon.ts
   ```
4. O script lerá os dados estruturados do OpenScriptures, fará o merge com as traduções para português/espanhol existentes em `public/data/strongs_hebrew.json` e gerará o arquivo enriquecido `public/data/strongs_hebrew_os.json`.

## Licença e Atribuição

O OpenScriptures HebrewLexicon é licenciado sob a licença **Creative Commons Attribution 4.0 International License (CC BY 4.0)**.

### Termos da Licença
Você é livre para:
- **Compartilhar**: copiar e redistribuir o material em qualquer suporte ou formato.
- **Adaptar**: remixar, transformar e criar a partir do material para qualquer fim, mesmo que comercial.

Sob as seguintes condições:
- **Atribuição**: você deve dar o crédito apropriado, prover um link para a licença e indicar se foram feitas alterações.

### Texto de Atribuição
> Os dados do léxico hebraico e BDB apresentados nesta plataforma foram enriquecidos a partir do projeto **OpenScriptures HebrewLexicon** (licenciado sob CC BY 4.0), desenvolvido por David Troidl e OpenScriptures contributors.
