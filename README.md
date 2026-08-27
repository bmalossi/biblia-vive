# ✦ Bíblia Vive — Plataforma de Leitura, Estudo e Edificação Bíblica

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Progressive_Web_App-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

> **A Palavra que vive, o estudo que esclarece, a caminhada que transforma.**

O **[Bíblia Vive](https://www.bibliavive.com.br)** é uma aplicação web progressiva (PWA) de alta performance e experiência imersiva, desenvolvida para transformar a forma como as pessoas leem, estudam, registram e compartilham as Escrituras Sagradas.

Unindo fidelidade teológica, curadoria histórica, inteligência de dados e design editorial refinado, a plataforma oferece uma experiência viva para a vida devocional e o estudo bíblico aprofundado no dia a dia.

---

## 🌟 Funcionalidades em Destaque

### 📖 Leitura Imersiva e Multiversão
* **Interface Fluida & Tipografia Editorial**: Modos de leitura pensados para conforto visual prolongado (tema claro, escuro e sépia), com controle total de fontes e espaçamento.
* **Comparações Paralelas**: Visualize versículos lado a lado entre traduções com destaque visual de variações textuais (diff dinâmico).
* **Múltiplas Versões & Línguas**: Suporte a ACF, ARC, NVI, KJA, KJV, RVR1960 e BBE.

### 🏛️ Estudo Aprofundado & Curadoria Histórica
* **Línguas Originais (Dicionário Strong)**: Suporte completo ao hebraico, aramaico e grego com morfologia, transliteração, pronúncia e lemas unificados.
* **Curadoria de Comentários Históricos com IA**: A inteligência artificial atua exclusivamente na curadoria, localização e tradução de comentários clássicos de teólogos da história da Igreja (sem geração inventiva de doutrina).
* **Referências Cruzadas & Contexto**: Informações sobre autoria, época, público-alvo, temas-chave e conexões teológicas imediatas por capítulo e versículo.

### 📓 Cadernos de Estudo (Estudo por Capítulo & Temático)
* **Workspace Dedicado de Anotações**: Interface em gaveta flutuante (*bottom sheet* no mobile e painel lateral no desktop) que permite escrever sem perder a visão do texto bíblico.
* **Organização Flexível**: Cadernos vinculados a capítulos específicos ou globais por tema, com suporte a formatação avançada (Markdown e Rich Text).
* **Exportação Completa**: Exporte seus cadernos e anotações diretamente em **PDF** ou **Word (.docx)** diagramados.

### 🪨 Meu Memorial — Marcos da Caminhada
* **Linha do Tempo Espiritual**: Registre memórias, reflexões, pedidos de oração, jejuns e testemunhos vinculados a passagens bíblicas.
* **Eco do Memorial**: Reencontro inteligente com anotações e orações passadas diretamente no capítulo lido, incentivando a reflexão sobre orações respondidas e fidelidade de Deus.
* **Filtros e Busca em Tempo Real**: Localize orações respondidas, entradas favoritas e temas em segundos.

### 🌿 Jornadas — Leituras Contemplativas
* **Ciclos de Permanência**: Séries editoriais estruturadas no movimento de *Encontro*, *Crescimento* e *Transformação*.
* **Leitura Guiada**: Meditações bíblicas temáticas para aprofundamento pessoal e discipulado.

### 🎵 Harpa Cristã & Áudio Integrado
* **Acervo Completo de Hinos**: Letras integradas com busca instantânea por número e título, com destaque de estrofes e refrão.
* **Player de Áudio de Alta Performance**: Hospedagem otimizada no Cloudflare R2 com avanço contínuo (reprodução automática do próximo hino/capítulo) e modo repetição (loop).
* **Áudio Narrado & Síntese de Voz (TTS)**: Ouça capítulos narrados com controles inteligentes de velocidade e pausa.

### 🎨 Criação de Cards & Compartilhamento Social
* **Gerador de Cards Bíblicos**: Modelos exclusivos (Pergaminho, Minimalista, Story, Banner e Editorial) prontos para redes sociais (Instagram Stories, Feed, WhatsApp).
* **Estatísticas & Planos de Leitura**: Acompanhamento de metas diárias (planos de 30, 90 e 365 dias) com sequências (*streaks*) e cards de progresso compartilháveis.

### 📜 Artigos, Autores & Governança Editorial (E-E-A-T)
* **Páginas de Artigos & Perfis de Autores**: Conteúdos doutrinários e teológicos com biografia, filiação ministerial e badges de revisão pastoral.
* **Metadados Estruturados Avançados**: Schemas completos Schema.org (`Article`, `Person`, `Chapter`, `BibleVersion`) para máxima relevância e autoridade nos mecanismos de busca.

### 📱 Experiência Offline e PWA
* Suporte total a instalação como aplicativo nativo no Android, iOS, Windows e macOS via Service Workers e cache offline inteligente.
* Notificações push contextuais para devocionais diários e planos de leitura.

---

## 🏗️ Arquitetura & Stack Tecnológica

O ecossistema do **Bíblia Vive** adota padrões modernos de arquitetura JAMstack e Serverless:

```
├── Frontend SPA / PWA (React 18 + Vite + TypeScript)
│   ├── UI: Tailwind CSS + Radix UI + Lucide Icons + Framer Motion
│   ├── Estado & Cache: TanStack React Query + Context API
│   └── Exportadores: jsPDF + docx + html-to-image
├── Backend as a Service (Supabase)
│   ├── PostgreSQL com RLS (Row Level Security)
│   ├── Auth (Magic Link, OAuth & Email)
│   ├── Edge Functions (Deno / TypeScript)
│   └── Storage
├── Áudio & Storage CDN: Cloudflare R2
├── Assinaturas & Pagamentos: Stripe API (Checkout & Webhooks)
├── IA & Curadoria: OpenAI GPT-4o API
└── SEO & Entrega:
    ├── Pré-renderizador estático proprietário (scripts/prerender.mjs)
    ├── IndexNow Protocol (Bing & buscadores parceiros)
    └── Sitemap.xml dinâmico multi-versões (+5.000 URLs indexáveis)
```

---

## 🚀 Começando

### Pré-requisitos
* **Node.js** `>= 18.0.0`
* **npm**, **pnpm** ou **yarn**
* Conta e projeto configurados no **Supabase**

### Instalação

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
Copie o arquivo de exemplo e preencha suas credenciais:
```bash
cp .env.example .env
```

Principais chaves de configuração:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Pagamentos (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# IA & Integrações
OPENAI_API_KEY=sk-...
INDEXNOW_KEY=sua-chave-indexnow
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

---

## 📦 Scripts Disponíveis

* `npm run dev`: Inicia o servidor local Vite em modo de desenvolvimento.
* `npm run build`: Compila a aplicação TypeScript/React e executa o pré-renderizador de páginas estáticas (`prerender.mjs`).
* `npm run preview`: Pré-visualiza o pacote de produção compilado localmente.
* `npm run test`: Executa os testes unitários e de integração via Vitest.
* `npm run indexnow`: Envia notificações de URLs atualizadas para o Bing via IndexNow.

---

## 📖 Direitos Autorais & Créditos Editoriais

O código-fonte e o design de experiência pertencem ao projeto **Bíblia Vive**. 

Os textos das traduções bíblicas e comentários históricos pertencem aos seus respectivos detentores de direitos e editoras:
* **ACF**: Sociedade Bíblica Trinitariana do Brasil.
* **NVI**: Biblica, Inc. / Sociedade Bíblica Internacional.
* **ARC**: Sociedade Bíblica do Brasil (SBB).
* **KJA**: Sociedade Bíblica Ibero-Americana & Abba Press.
* **KJV & BBE**: Domínio Público nas jurisdições aplicáveis.

---

<p align="center">
  Desenvolvido com reverência, excelência e dedicação para a edificação da Igreja. 🕊️<br/>
  <b><a href="https://www.bibliavive.com.br">Acesse bibliavive.com.br</a></b>
</p>