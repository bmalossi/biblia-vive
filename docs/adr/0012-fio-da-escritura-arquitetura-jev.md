# Fio da Escritura: Arquitetura JEV via Vercel Function com controles admin em app_config

O Fio da Escritura detecta conexões tipológicas entre o capítulo lido e os Registros do Memorial do Leitor usando o modelo JEV (TypeSafe AI). A chamada à API JEV roda em uma Vercel Function (`api/scripture-thread.ts`) — não no cliente — para manter a API key segura, seguindo o padrão já estabelecido por `api/tts.ts` e `api/commentary`. A Supabase Edge Function foi descartada porque o caso de uso é reativo (on-demand durante leitura), não agendado; Edge Functions no projeto são usadas exclusivamente para jobs por cron ou webhooks do Supabase.

Os parâmetros operacionais (habilitado, granularidade, limite de notas, requer PRO) são controlados por uma tabela `app_config` no Supabase (chave-valor JSONB), lida tanto pelo cliente quanto pelo servidor. Isso permite que o administrador altere qualquer parâmetro instantaneamente via `/admin/configuracoes` sem redeploy — crítico durante a fase de teste de custo e performance.

## Considered Options

- **Supabase Edge Function**: descartada — adequada para jobs agendados, mas adiciona fricção de CORS e deployment separado para chamadas reativas autenticadas.
- **Variável de ambiente Vercel para feature flags**: descartada — requer redeploy a cada mudança de parâmetro, inviável para experimentação de granularidade.
- **Chamada direta do cliente (`VITE_TYPESAFE_API_KEY`)**: descartada — expõe a API key no bundle público.

## Consequences

- Requer criação da tabela `app_config` no Supabase e migração SQL (Sprint 30).
- A Vercel Function precisa ser declarada em `vercel.json` com `maxDuration: 10`.
- O SDK TypeSafe AI não está instalado — a chamada será feita via `fetch` direto ao endpoint REST do JEV (`POST https://api.typesafe.ai/v1/eval`) até que um SDK npm oficial seja publicado.
