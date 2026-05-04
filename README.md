# ✦ Bíblia Vive

> A Palavra que vive, o estudo que esclarece.

O **Bíblia Vive** é uma aplicação web progressiva (PWA) de alto desempenho, criada para oferecer uma experiência de leitura e estudo bíblico em português com foco em clareza, profundidade e excelência de interface.

Mais do que uma Bíblia online, o projeto combina leitura imersiva, recursos avançados de estudo, contexto histórico e ferramentas modernas de comparação, anotação e áudio em uma experiência pensada para uso diário.

## ✨ Funcionalidades Principais

- **Leitura imersiva**: interface focada, fluida e livre de distrações, com tipografia refinada para leitura prolongada.
- **Curadoria de comentários históricos**:
  - A IA atua como uma camada de curadoria, não como autora teológica.
  - O sistema localiza, seleciona e organiza trechos relevantes de comentaristas históricos e obras de referência.
  - Quando aplicável, a IA também auxilia na tradução e adaptação desses fragmentos para melhorar acessibilidade e compreensão.
- **Estudo das línguas originais**:
  - Integração com o Dicionário Strong.
  - Suporte a hebraico e grego com transliteração e dados morfológicos.
- **Contexto histórico e literário**: informações sobre autoria, período, temas, estrutura e propósito dos livros bíblicos.
- **Comparação paralela de versões**: visualização lado a lado com destaque para diferenças textuais entre traduções.
- **Recursos de estudo pessoal**: marcações, destaques, anotações e experiências premium voltadas a aprofundamento individual.
- **Áudio e acessibilidade**: leitura em voz com suporte a tecnologias modernas de síntese e reprodução.
- **Experiência offline (PWA)**: suporte a instalação em dispositivos móveis e desktop, com carregamento rápido e uso contínuo.

## 🚀 Stack e Arquitetura

O projeto foi construído com uma stack moderna, orientada a performance, escalabilidade e experiência de uso:

- **Frontend**: React, Vite e TypeScript.
- **UI**: Tailwind CSS, Radix UI e Lucide Icons.
- **Backend e dados**: Supabase (PostgreSQL, autenticação, storage e edge/serverless functions).
- **Pagamentos e assinatura**: Stripe.
- **IA aplicada à curadoria**: OpenAI para seleção, filtragem e apoio à organização de conteúdos históricos.
- **Áudio**: ElevenLabs, Web Speech API e camadas de cache para otimização de entrega.
- **SEO e indexação**: prerendering, metadados estruturados, sitemap e páginas otimizadas para descoberta orgânica.

## 🛠 Desenvolvimento local

### Pré-requisitos

- **Node.js** v18+
- **npm** ou compatível
- **Supabase CLI** (opcional)
- Variáveis de ambiente para os serviços utilizados

### Instalação

```bash
git clone https://github.com/bmalossi/biblia-vive.git
cd biblia-vive
npm install
```

### Ambiente

Crie um arquivo `.env` com base no `.env.example` e configure as variáveis necessárias para seu ambiente local.

Exemplos de variáveis usadas pelo projeto:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `ELEVENLABS_API_KEY`

### Execução

```bash
npm run dev
```

## 📚 Textos bíblicos e créditos

O código-fonte deste projeto refere-se à aplicação **Bíblia Vive** e à sua arquitetura de produto.

Os textos bíblicos disponibilizados pela plataforma pertencem aos seus respectivos detentores de direitos autorais. Este repositório não reivindica titularidade sobre traduções bíblicas, comentários históricos ou conteúdos de terceiros, reconhecendo e atribuindo os créditos devidos a cada fonte correspondente.

### Traduções e créditos

- **Almeida Corrigida Fiel (ACF)**  
  Bíblia Sagrada – Almeida Corrigida Fiel (ACF).  
  © Sociedade Bíblica Trinitariana do Brasil.

- **Nova Versão Internacional (NVI)**  
  Bíblia Sagrada – Nova Versão Internacional (NVI).  
  Copyright © International Bible Society / Biblica.

- **Almeida Revista e Corrigida (ARC)**  
  Texto bíblico © Sociedade Bíblica do Brasil.

- **King James Atualizada (KJA)**  
  Bíblia King James Atualizada (KJA).  
  © Sociedade Bíblica Ibero-Americana & Abba Press.

- **Reina-Valera 1960 (RVR1960)**  
  Reina-Valera 1960 ® © Sociedades Bíblicas en América Latina, 1960; renovado © Sociedades Bíblicas Unidas, 1988.

- **Bible in Basic English (BBE)**  
  Tradução em domínio público, conforme documentação pública disponível.

- **King James Version (KJV)**  
  Utilizada considerando seu status de domínio público em diversas jurisdições, observadas as condições aplicáveis em localidades específicas.

- **AA (identificador interno da aplicação)**  
  A origem textual e os termos aplicáveis devem seguir a edição correspondente utilizada pela plataforma.

## 📜 Licença do projeto

Salvo indicação em contrário quanto a conteúdos de terceiros, o código deste projeto pode ser licenciado separadamente da base textual bíblica.

Os textos bíblicos, traduções, nomes editoriais, marcas e conteúdos correlatos permanecem vinculados aos seus respectivos titulares.

## ✦ Propósito

O **Bíblia Vive** existe para ampliar o acesso à leitura e ao estudo bíblico com seriedade, beleza e profundidade — unindo tradição, tecnologia e usabilidade em uma experiência digital à altura da importância do texto.
