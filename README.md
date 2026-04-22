# ✦ Bíblia Vive

> A palavra que vive, o estudo que esclarece. A melhor experiência de leitura e estudo bíblico em português.

O **Bíblia Vive** é uma aplicação web progressiva (PWA) de alto desempenho, construída para oferecer uma leitura bíblica imersiva, tipograficamente superior e teologicamente rica. 

Diferente de outras plataformas, o foco aqui é a **erudição histórica**. Nossa funcionalidade de comentários não cria textos via IA; em vez disso, utilizamos Inteligência Artificial apenas como uma **curadora especializada** para buscar, selecionar e traduzir os fragmentos mais pertinentes de comentários reais de teólogos historiamente renomados.

## ✨ Funcionalidades Principais

- **Leitura Imersiva**: Interface focada, livre de distrações, com tipografia *premium* (Lora & DM Sans). 
- **Curadoria de Comentários Históricos (IA Selection)**:
  - IA atua como editora: ela vasculha milhares de páginas de comentaristas clássicos (como Albert Barnes, Matthew Henry, John Gill) e seleciona os trechos que falam **diretamente** sobre o versículo que você está lendo.
  - **Nota importante**: Os comentários são **reais**, de autores históricos. A IA é usada apenas para a seleção inteligente e tradução fiel, garantindo precisão teológica sem alucinações.
- **Estudo de Línguas Originais**:
  - Integração total com o Dicionário Strong.
  - Textos originais em Hebraico e Grego com análise morfológica e transliteração.
- **Contexto Histórico**: Metadados completos sobre cada livro da Bíblia (autor, data, temas e propósitos).
- **Comparação Paralela**: Motor de diff visual que destaca as diferenças de tradução entre as versões da Bíblia lado a lado.
- **Personalização de Estudo**: Marcação por cores, anotações ricas e exportação para PDF (Pro).
- **Tecnologia Offline (PWA)**: Carregamento instantâneo e suporte a instalação nativa no iOS, Android e Desktop.

## 🚀 Tecnologias e Stack

A arquitetura do projeto utiliza o estado da arte do desenvolvimento web moderno:

- **Frontend**: React (Vite), TypeScript, Tailwind CSS.
- **Componentes**: Radix UI e Lucide Icons para acessibilidade e consistência.
- **Backend (Serverless)**: Supabase (PostgreSQL, Auth e Edge Functions).
- **Ccache & Performance**: Redis (Upstash) para controle de limites e cache de comentários selecionados.
- **Inteligência de Curadoria**: OpenAI (GPT-4o-mini) para seleção e filtragem de textos históricos.
- **Áudio**: ElevenLabs (Vozes neurais de alta fidelidade) e Web Speech API.

## 🛠 Configuração de Desenvolvimento

### Pré-requisitos
- **Node.js** v18+
- **Supabase CLI** (opcional, para deploys de funções)
- Chaves de API para OpenAI e Supabase.

### Passo a Passo

1.  **Clone e Instalação**:
    ```bash
    git clone https://github.com/bmalossi/biblia-vive.git
    cd biblia-vive
    npm install
    ```

2.  **Ambiente**:
    Configure seu `.env` com as chaves:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `VITE_BIBLE_API_KEY` (Chave da API.Bible)

3.  **Execução**:
    ```bash
    npm run dev
    ```

## 📜 Propósito e Licença

Este projeto existe para democratizar o acesso ao estudo bíblico profundo, unindo a sabedoria dos séculos passados com a tecnologia de ponta do presente.

Todos os direitos reservados à **Bíblia Vive**.
