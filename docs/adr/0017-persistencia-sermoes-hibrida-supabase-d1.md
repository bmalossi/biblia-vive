# ADR-0017: Persistência de Sermões na Conta do Usuário (Supabase + Cloudflare D1 Opcional)

## Contexto
O ADR-0015 definiu a persistência do Estúdio Homilético no Cloudflare D1 via Worker dedicado para economizar armazenamento no Supabase. No entanto, na prática:
1. O worker homilético não foi publicado na infraestrutura Cloudflare (ficando com `database_id = "homiletic-d1-placeholder"` e o domínio `estudio.bibliavive.com.br` sem DNS).
2. Como resultado, em ambientes de desenvolvimento e produção, todas as chamadas de rede falhavam silenciosamente, ativando o fallback de `localStorage`.
3. Os sermões ficavam confinados exclusivamente ao navegador onde foram criados, não sendo persistidos na conta do usuário no Supabase (`auth.users`).
4. Ao abrir o aplicativo ou navegar por outro dispositivo (como smartphone ou outro navegador) com a mesma conta logada, os sermões criados não apareciam.

## Decisão
Adotar uma **arquitetura de nuvem híbrida com Supabase nativo**:
1. **Supabase como Nuvem da Conta:** Criar as tabelas `public.sermons` e `public.preaching_logs` no Supabase (`supabase/sprint32-homiletic-studio-schema.sql`) com Row Level Security (RLS) associado a `auth.uid() = user_id`.
2. **Sincronização Automática (Auto-Sync):** Ao carregar o Estúdio Homilético, o cliente verifica se existem sermões legados no `localStorage` do navegador e faz o upload automático para a conta do usuário no Supabase, garantindo que nenhum esboço anterior seja perdido.
3. **Resiliência Offline-First:** Toda operação de leitura e escrita atualiza o `localStorage`. Se a conexão cair ou a tabela ainda não estiver criada, a aplicação continua operando sem erros na tela.
4. **Cloudflare D1 Preservado:** Caso a variável de ambiente `VITE_HOMILETIC_WORKER_URL` seja configurada com um worker Cloudflare ativo, o cliente priorizará a borda D1. Sem ela, utiliza nativamente o Supabase já conectado.

## Consequências
- **Sincronização Multi-Dispositivo:** Os sermões criados no desktop aparecem imediatamente no app mobile e PWA, e vice-versa.
- **Segurança e RLS:** Cada pastor/usuário acessa estritamente seus próprios sermões e históricos de púlpito.
- **Zero Atrito:** Não depende de infraestrutura externa não provisionada para funcionar.
