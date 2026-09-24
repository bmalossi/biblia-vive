# Motor de Busca Bíblica: Cloudflare D1 com FTS5 na Edge

O motor de busca anterior executava um loop sequencial de 66 requisições HTTP (`fetch`) no navegador do Leitor, varrendo livro por livro com verificação estrita de substring (`plainText.includes(searchTerm)`). Isso gerava lentidão excessiva (vários segundos por busca), impedia a localização de termos intercalados (ex.: "há júbilo" não encontrava "há grande júbilo") e falhava em pequenas variações tipográficas.

Embora o PostgreSQL do Supabase possua suporte a Full-Text Search (`tsvector` e `pg_trgm`), a cota gratuita do banco do projeto atingiu 523,16 MB (excedendo o limite de 500 MB). Inserir os 31.102 versículos de múltiplas versões bíblicas com índices de texto adicionaria entre 80 MB e 200 MB de armazenamento em disco, inviabilizando o uso do Supabase.

A solução adotada utiliza o **Cloudflare D1**, banco de dados relacional baseado em SQLite que opera diretamente na borda (Edge) da Cloudflare. O D1 oferece 5 GB de armazenamento no plano gratuito (10x o limite do Supabase), tempo de resposta de 5 a 15 ms e suporte nativo ao módulo **FTS5** (Full-Text Search 5).

## Considered Options

- **PostgreSQL Full-Text Search no Supabase**: descartado — adicionaria até 200 MB ao banco de dados que já ultrapassou a cota de 500 MB do plano gratuito.
- **Download integral de pacote ou índice no navegador do Leitor**: descartado — obrigaria o Leitor a baixar megabytes de texto bíblico por versão, consumindo franquia de dados móveis e memória RAM do dispositivo.
- **Vercel Serverless Function com arquivo SQLite embutido**: descartada — sujeita a cold starts de Node.js e limites de tamanho de bundle da Vercel.
- **Cloudflare D1 com FTS5**: **escolhida** — 5 GB gratuitos, latência ultra-baixa na Edge, suporte nativo a busca por termos combinados (`AND`/`NEAR`), prefixos e ranking de relevância com custo zero no Supabase e download zero no cliente.

## Consequences

- O acervo bíblico das versões suportadas é compilado e inserido em uma tabela virtual FTS5 no Cloudflare D1.
- A aplicação consulta a busca diretamente via **Cloudflare Worker dedicado** (com subdomínio próprio ou rota Cloudflare), recebendo apenas os resultados paginados (~3 KB a 5 KB por consulta).
- O tráfego de busca **não consome requisições na Vercel**, preservando integralmente a cota de Serverless/Edge Functions da Vercel.
- O banco Supabase permanece com 0 MB de acréscimo, aliviando a infraestrutura.
- A busca passa a suportar múltiplos termos em qualquer ordem, proximidade e tolerância ortográfica básica com resposta instantânea (<15 ms).
