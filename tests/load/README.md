# Bíblia Vive — Load Tests

Scripts de medição de capacidade usando [k6](https://k6.io).

---

## Pré-requisitos

### 1. Instalar o k6

**Windows (winget):**
```powershell
winget install k6 --source winget
```

**Windows (Chocolatey):**
```powershell
choco install k6
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

Verificar: `k6 version`

---

### 2. Criar o arquivo de credenciais

> [!IMPORTANT]
> **Use uma conta PRO de teste separada** — nunca a conta de admin/produção.
> Crie uma conta nova no [bibliavive.com.br](https://www.bibliavive.com.br),
> assine (ou ative manualmente via Supabase) o plano PRO para essa conta,
> e use essas credenciais abaixo.

```powershell
# Na raiz do repositório:
copy tests\load\.env.load-test.example tests\load\.env.load-test
# Edite o arquivo e preencha TEST_EMAIL e TEST_PASSWORD
```

O arquivo `.env.load-test` está no `.gitignore` — nunca vai para o repositório.

---

## Arquivos

| Arquivo | Cenário testado | Camada |
|---|---|---|
| `home.js` | Usuário anônimo acessa a home | Vercel CDN |
| `leitura.js` | Usuário anônimo lê capítulo bíblico | Vercel CDN (JSON estático) |
| `supabase-rest.js` | Usuário logado sincroniza plano + subscription | Supabase Postgres |
| `commentary.js` | Usuário PRO pede comentário de versículo | Supabase Edge + OpenAI |

---

## Como rodar

### Smoke test (rápido — confirma que tudo funciona)

```bash
k6 run --vus 1 --iterations 3 tests/load/home.js
k6 run --vus 1 --iterations 3 tests/load/leitura.js
k6 run --vus 1 --iterations 1 \
  -e TEST_EMAIL="seu@email.pro" -e TEST_PASSWORD="suasenha" \
  tests/load/supabase-rest.js
```

### Testes de carga completos

```bash
# CDN — home page (vai até 100 VUs)
k6 run tests/load/home.js

# CDN — leitura de capítulo (vai até 150 VUs)
k6 run tests/load/leitura.js

# Supabase Postgres — plano + subscription (vai até 30 VUs)
k6 run -e TEST_EMAIL="seu@email.pro" -e TEST_PASSWORD="suasenha" tests/load/supabase-rest.js

# Edge Function + OpenAI (CUIDADO: gera custo real — máx. 5 VUs × 20 iterações)
k6 run -e TEST_EMAIL="seu@email.pro" -e TEST_PASSWORD="suasenha" tests/load/commentary.js
```

### Salvar resultados em JSON

```bash
k6 run --out json=tests/load/results/supabase-rest-results.json \
  -e TEST_EMAIL="seu@email.pro" -e TEST_PASSWORD="suasenha" \
  tests/load/supabase-rest.js
```

---

## Como interpretar os resultados

Ao final de cada teste o k6 exibe uma tabela como:

```
http_req_duration............: avg=142ms  min=45ms   med=120ms  max=1.2s  p(90)=280ms  p(95)=420ms
http_req_failed..............: 0.00%  ✓ 0      ✗ 1200
http_reqs....................: 1200   18.5/s
```

| Métrica | O que significa | Limite aceitável |
|---|---|---|
| `http_req_duration p(95)` | 95% das requisições responderam em X ms | < 2 000 ms (geral) / < 800 ms (Postgres) |
| `http_req_failed` | % de erros HTTP (4xx/5xx) | < 1 % |
| `http_reqs/s` | Requisições por segundo (RPS) | — |

### Convertendo RPS em usuários reais

Suponha que o `supabase-rest.js` falhe com 30 VUs:

- Cada VU faz ~2 queries e espera 3–8 s → **~0.3 req/s por usuário simultâneo**
- 30 VUs × 0.3 = ~9 RPS no Postgres
- Um usuário típico permanece no site ~8 min por sessão
- Se o site aguenta 30 usuários **simultâneos** com p95 < 800 ms:
  → `30 simultâneos × (24h × 60min / 8min por sessão)` = ~5 400 usuários únicos/dia
  (calculado para distribuição uniforme ao longo do dia — pico real é menor)

---

## Identificando gargalos

| O que você vê | Interpretação | Ação |
|---|---|---|
| `home.js` falha com 50+ VUs | Vercel CDN ou rewrite lento | Verificar vercel.json rewrites; considerar Vercel Pro |
| `leitura.js` falha com 100+ VUs | JSON estático não cacheado | Confirmar `Cache-Control` nos headers do Vercel |
| `supabase-rest.js` falha com 20–30 VUs | Postgres connection pool esgotado | Ativar PgBouncer (Supabase Pro) ou adicionar índices |
| `supabase-rest.js` retorna 429 | Rate limit do Supabase REST API | Supabase Pro tem limites maiores |
| `commentary.js` retorna 504 | Edge Function timeout (> 10 s) | Verificar logs no Supabase Dashboard |
| `commentary.js` retorna 429 | Rate limit da OpenAI ou do Supabase | Aumentar tier OpenAI ou adicionar cache de comentários |

---

## Como rodar novamente no futuro

Os scripts são autossuficientes. Para medir a capacidade após uma mudança:

```bash
# 1. Tenha as credenciais da conta de teste em mãos
# 2. Rodar o teste relevante
k6 run -e TEST_EMAIL="seu@email.pro" -e TEST_PASSWORD="suasenha" tests/load/supabase-rest.js
# 3. Comparar p95 e RPS com o baseline documentado no walkthrough.md
```
