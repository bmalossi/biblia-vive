# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Leitor** (Pessoa com conta criada na plataforma): cristãos engajados em leitura bíblica diária, devocional contínuo, estudo histórico/exegético e registro pessoal de sua caminhada espiritual com Deus (reflexões SOAP, orações, testemunhos, jejuns/propósitos no Meu Memorial).
- **Pregador** (Leitor com acesso ao plano Templo): pastores, líderes e ministros da Palavra que utilizam o Estúdio Homilético para estruturar e germinar sermões expositivos e inspirados a partir de fagulhas espirituais do cotidiano via Método da Marcha-Ré.
- **Visitante** (Pessoa que acessa sem conta criada): leitores que buscam consulta bíblica rápida, leitura imersiva livre e artigos teológicos indexados nos mecanismos de busca (SEO/E-E-A-T).

*Terminologias a evitar: usuário, user, membro, usuário anônimo.*

## Product Purpose

O Bíblia Vive existe para **preservar e enriquecer os encontros diários entre o Leitor e a Palavra de Deus**. A leitura é o início; a **permanência diária nas Escrituras** é o destino.

O produto transforma conhecimento implícito e leitura fragmentada em uma caminhada contínua, estruturada e viva com Deus, garantindo fidelidade teológica, curadoria histórica de autores clássicos da Igreja e preservação permanente dos marcos espirituais do Leitor.

## Positioning

- **Categoria Oficial:** Plataforma de Permanência nas Escrituras.
- **Categorias Recusadas:** Não é aplicativo devocional genérico, leitor de Bíblia tradicional, ferramenta de produtividade espiritual nem plataforma de IA cristã.
- **Promessa Central:** *"Ajudamos você a permanecer diariamente na Palavra de Deus."*
- **Mecanismo Diferenciador:** A Escritura Sagrada é o centro absoluto e sujeito ativo da experiência; a tecnologia e a IA ocupam papel estrito de serviço (curadoria histórica, lemas Strong e transcrição em alta fidelidade), sem jamais substituir ou alucinar sobre o texto bíblico. Combinação fluida entre Leitura Imersiva (Modo Clausura), diário espiritual ativo (Meu Memorial) e preparo ministerial profundo (Estúdio Homilético).

## Operating Context

- **Ambientes de Uso:** 
  - *Mobile/Tablet:* Leitura devocional no início ou fim do dia, áudio em trânsito, registro rápido de orações e testemunhos por voz.
  - *Desktop/Laptop:* Estudo bíblico minucioso, exegese em línguas originais, anotações paralelas em gaveta/painel lateral e elaboração de sermões no Estúdio Homilético.
- **Rituais & Modos:**
  - *Leitura Devocional & Modo Clausura:* Tela focada exclusiva para desktop onde a interface periférica se recolhe com suavidade, mantendo o título sticky e o texto sagrado em destaque contemplativo.
  - *Alternância de Temas:* Claro, Escuro e Sépia calibrados com tipografia editorial para conforto visual prolongado.
  - *Meu Memorial:* Registro por voz ou digitação vinculado diretamente a capítulos e versículos bíblicos.
- **Conectividade:** Aplicação Web Progressiva (PWA) de alta performance, resiliente e utilizável offline.

## Capabilities and Constraints

- **Capacidades Confirmadas:**
  - Leitura multi-tradução comparativa com diff visual dinâmico (ACF, ARC, NVI, KJA, KJV, RVR1960, BBE).
  - Dicionário Strong unificado com transliteração, morfologia e lemas originais em hebraico, aramaico e grego.
  - Meu Memorial (`/memorial`) com 5 categorias: Reflexão (SOAP), Oração (com histórico de respostas), Testemunho, Jejum/Propósito e Inspiração Homilética.
  - Gravação rápida de áudio e voz em alta fidelidade (AssemblyAI Universal-2 pt-BR + Cloudflare R2 + Web Speech API fallback).
  - Estúdio Homilético (`/estudio`) com arquitetura 3x4 (Explicar, Pregar, Aplicar), 4 Degraus (A, B, C, D) e persistência em Cloudflare D1.
  - Harpa Cristã com acervo completo e player integrado contínuo/loop.
  - Exportação diagramada de cadernos em PDF e Word (.docx).
  - Gerador de cards bíblicos para compartilhamento social sóbrio e contemplativo.
- **Restrições Técnicas & Éticas:**
  - Sem IA com autoridade espiritual ou geração inventiva de doutrina.
  - Sem mecanismos de dependência psicológica, contadores punitivos de dias perdidos ou manipulação emocional.
  - Respeito integral à privacidade espiritual do Leitor (segurança RLS no banco de dados).

## Brand Commitments

- **Governança Institucional:** Subordinação permanente ao **Projeto Logos** e à **Constituição Institucional** (`docs/branding/core/CONSTITUTION.md`). Nenhuma funcionalidade ou campanha pode contrariar estes princípios.
- **Tom de Voz:** Sóbrio, reverente, contemplativo, acolhedor e editorial. Distante de jargões corporativos, hype de IA ou infantilização da fé.
- **Cores Canônicas do Memorial:**
  - *Reflexão:* Dourado.
  - *Oração:* Azul discreto.
  - *Testemunho:* Verde suave.
  - *Jejum / Propósito:* Cinza ardósia.
  - *Identidade Principal:* Bronze/Dourado bíblico (`#9a6e1e`).
- **Vocabulário Oficial Estrito:**
  - `Leitor` (não "usuário" ou "membro");
  - `Visitante` (não "usuário anônimo");
  - `Meu Memorial` (não "caderno" na interface, "bloco de notas" ou "diário");
  - `Plano de Leitura` (não "programa" ou "cronograma");
  - `Referência` (não "passagem" ou "trecho solto");
  - `Destaque` (não "marcação" ou "sublinhado");
  - `Dias Concluídos` (não "streak" ou "sequência").

## Evidence on Hand

- Plataforma ativa em produção: `https://www.bibliavive.com.br`.
- Acervo documental completo de identidade e marca em `docs/branding/` (`00-CHARTER.md`, `CONSTITUTION.md`, `PHILOSOPHY.md`, `POSITIONING.md`, `DESIGN_SYSTEM.md`, `IMAGERY.md`, `VOICE.md`, `DOMAIN.md`).
- Documentação técnica e de domínio em `CONTEXT.md` e PRDs em `docs/` (`prd-memorial-da-caminhada.md`, `prd-modo-clausura.md`, `prd-lexico-hebraico.md`, etc.).
- Bíblias em texto estruturado e base léxica Strong integradas.
- Áudios da Harpa Cristã e hinos hospedados em Cloudflare R2.

## Product Principles

1. **A Escritura é o Centro Absoluto:** A Palavra de Deus é a autoridade máxima e o sujeito ativo da experiência; nenhuma tecnologia, comentário ou IA concorre com ela.
2. **Tecnologia em Posição de Serviço:** Recursos existem para aproximar o Leitor das Escrituras e remover atritos, priorizando simplicidade sobre sofisticação técnica desnecessária.
3. **Respeito ao Tempo e à Caminhada:** A plataforma não acelera artificialmente nem manipula o Leitor com métricas coercitivas de consumo; cada caminhada espiritual é única.
4. **Preservação da Memória Espiritual:** O registro de orações, reflexões e testemunhos transforma o estudo em edificação permanente, gerando memoriais vivos da fidelidade divina.
5. **Excelência Editorial e Sobriedade Visual:** Design tipográfico refinado, contemplativo e atemporal, concebido para leitura demorada e livre de distrações ou ruídos visuais passageiros.

## Accessibility & Inclusion

- Conforto de leitura prolongada com suporte a 3 temas (Claro, Escuro e Sépia) com alto contraste.
- Controles finos de legibilidade: tamanho de tipografia, altura de linha e largura do container de leitura.
- Acessibilidade para leitores de tela e navegação fluida por teclado via componentes primitivos acessíveis (Radix UI / WAI-ARIA).
- Acessibilidade auditiva e visual por meio de capítulos narrados e síntese de voz (TTS).
- Ditado por voz de alta fidelidade no Meu Memorial para facilitar o registro a leitores com dificuldades motoras ou de digitação.
