# fetchChapter usa adapter pattern com cadeia de fallback configurável por versão

`bibleApi.ts` expõe `fetchChapter(version, bookId, chapter)` através de uma cadeia de adapters, não de `if/catch` embutidos. Cada adapter implementa:

```ts
interface ChapterSourceAdapter {
  readonly name: "local" | "api" | "github" | "original-language"
  fetch(slug: string, version: string, chapter: string): Promise<Chapter | null>
}
```

Contratos do adapter:
- Retorna `null` para miss permanente ("não tenho este livro/versão") → cadeia tenta o próximo
- Lança para falha transiente ("rede caiu") → orquestrador propaga o erro ao chamador
- Recebe `slug` **pré-resolvido** pelo orquestrador — nenhum adapter faz resolução de slug internamente
- Mantém cache de resposta como estado interno da instância — um singleton por adapter em produção, instância fresh em testes

O orquestrador monta a cadeia com base na versão recebida:
- `version === "org"` → `[originalLanguageAdapter]`
- qualquer outra versão → `[localAdapter, apiAdapter, githubAdapter]`

O campo `Chapter.source` é preenchido pelo orquestrador com `adapter.name` quando um adapter retorna algo diferente de `null`.

## Considered options

- `if/catch` em cascata dentro de `fetchChapter` (situação atual): descartado por tornar a cadeia de fallback invisível a testes sem mockar `fetch` globalmente.
- Adapter recebe `bookId` bruto e resolve o slug internamente: descartado porque duplica os slug-maps em cada adapter.
