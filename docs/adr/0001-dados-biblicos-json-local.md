# Dados bíblicos armazenados como JSON local no bundle

Os textos bíblicos são distribuídos como arquivos JSON estáticos dentro do bundle (`public/bible/`), sem chamadas a APIs externas para leitura. Essa decisão elimina latência de rede para o caso de uso central do produto (ler um capítulo), remove dependência de terceiros para o conteúdo principal, e simplifica o deploy. A contraparte é um bundle significativamente maior. A escolha foi deliberada: para uma aplicação de leitura offline-first e PWA, a experiência de leitura instantânea tem mais valor que o tamanho do download inicial.

## Versões disponíveis

| Idioma | Versões |
|---|---|
| Português (pt-br) | AA, ACF, ARC, KJA, NVI |
| Inglês (en) | BBE, KJV |
| Espanhol (es) | RVR |

Também incluídos: textos de referência `antigo_testamento_hebraico.json` e `novo_testamento_grego.json`.
