# ✦ Bíblia Vive

> A melhor experiência de leitura da Bíblia em português.

O **Bíblia Vive** é uma aplicação web moderna e progressiva (PWA) construída com React, TypeScript e Tailwind CSS. Focado em acessibilidade, tipografia de alta qualidade e uma experiência de usuário imersiva, o Bíblia Vive oferece funcionalidades avançadas para o estudo teológico e leitura diária.

## ✨ Funcionalidades Principais

- **Leitura Imersiva**: Diferentes versões da Bíblia (NVI, ACF, ARA, etc.) com layout focado e livre de distrações.
- **Painel de Estudo Inteligente**:
  - Dicionário Strong e análise morfológica.
  - Textos originais em Hebraico/Grego transliterados e traduzidos.
  - Contexto histórico e geográfico completo de cada livro.
  - **Assistente IA (Pro)**: Explicações teológicas instantâneas geradas por inteligência artificial.
- **Comparação Paralela**: Motor de diff visual para comparar diferenças de tradução entre duas versões lado a lado.
- **Caderno de Anotações**: Marcação de versículos por cores, anotações ricas e exportação para PDF (Pro).
- **Planos de Leitura Diária**: Acompanhamento de progresso com sincronização entre dispositivo local e nuvem.
- **Versículo do Dia**: Curadoria diária com integração para compartilhamento e widget incorporável em outros sites.
- **Áudio Premium TTS**: Narração neural e ultra-realista dos capítulos.
- **PWA (Progressive Web App)**: Leitura offline e instalação nativa em dispositivos móveis e desktops.

## 🚀 Tecnologias e Stack

O frontend é impulsionado pelo ecossistema Vite + React, com um backend Serverless suportado pela Vercel e Supabase.

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Shadcn/UI, Radix UI.
- **State & Data Fetching**: TanStack Query (React Query), Zustand (se aplicável), Supabase Client.
- **Backend / Serverless**: Vercel Edge Functions (`api/` directory), Supabase (PostgreSQL, Auth, Storage).
- **Monetização e Pagamentos**: Stripe Checkout e Webhooks.
- **IA & Serviços Externos**: OpenAI (Geração de estudos), ElevenLabs (Text-to-Speech premium), Fallback TTS via Google.

## 🛠 Como Executar Localmente

### Pré-requisitos
- Node.js (v18+)
- Conta no [Supabase](https://supabase.com/) (para Auth, Database e Storage)
- Conta no [Stripe](https://stripe.com/) (opcional, para testar fluxos Pro)

### Configuração

1. Clone o repositório:
   ```bash
   git clone https://github.com/bmalossi/biblia-vive.git
   cd biblia-vive
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto e preencha as seguintes chaves (consulte a documentação interna para detalhes de cada serviço):
   ```env
   VITE_SUPABASE_URL=seu_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID=price_...

   ELEVENLABS_API_KEY=sua_chave_elevenlabs # Opcional (usa fallback se ausente)
   ```

4. Execute os scripts SQL no Supabase:
   Vá até o SQL Editor do seu projeto Supabase e execute os scripts localizados na pasta `supabase/` (ex: `sprint12-schema.sql`, `sprint13-schema.sql`) para criar as tabelas e políticas (RLS) necessárias.

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:8080`.

## 📜 Licença

Desenvolvido para fortalecer a fé e democratizar o acesso ao estudo bíblico profundo.

Todos os direitos reservados à Bíblia Vive.
