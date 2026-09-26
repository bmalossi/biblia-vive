# Persistência do Estúdio Homilético no Cloudflare D1

## Contexto
O banco de dados PostgreSQL do Supabase atingiu sua cota de armazenamento do plano gratuito (523 MB / 500 MB). Criar novas tabelas estruturadas de sermões, tópicos em degraus e histórico de púlpito dentro do Supabase agravaria o bloqueio de infraestrutura e aumentaria custos.

## Decisão
A persistência do módulo do Estúdio Homilético e de seus sermões será centralizada no **Cloudflare D1** (SQLite na Edge), operando via **Cloudflare Worker** dedicado.

- A autenticação permanece unificada: o frontend envia o JWT emitido pelo Supabase Auth, e o Cloudflare Worker valida a assinatura criptográfica do token, extraindo o `user_id`.
- O isolamento de dados do Leitor/Pregador é aplicado via queries parametrizadas por `user_id` no Worker (substituindo o RLS do Postgres).
- Referências a entidades do Supabase (como `inspiration_note_id` do Memorial) são tratadas como chaves lógicas (UUID string) sem constraint relacional rígida entre bancos.

## Consequências
- **Armazenamento:** 5 GB disponíveis no plano gratuito da Cloudflare (10x a cota do Supabase), custo zero no Supabase.
- **Performance:** Leituras e escritas na Edge com latência entre 5 ms e 20 ms.
- **Resiliência:** O banco principal de leitura da plataforma fica isolado de picos de escrita gerados pela elaboração de esboços.
- **Desacoplamento:** Uma futura migração do banco principal de usuários não quebra o armazenamento homilético.
