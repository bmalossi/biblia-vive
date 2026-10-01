---
name: Bíblia Vive
description: Plataforma de Permanência nas Escrituras
colors:
  primary: "hsl(38 46% 45%)"
  primary-foreground: "#ffffff"
  gold-bg: "hsl(40 57% 87%)"
  parchment-bg: "hsl(42 32% 94%)"
  parchment-surface: "hsl(44 30% 91%)"
  parchment-raised: "hsl(44 26% 88%)"
  night-bg: "hsl(30 13% 10%)"
  night-surface: "hsl(28 12% 14%)"
  night-raised: "hsl(30 11% 18%)"
  text-ink: "hsl(28 25% 19%)"
  text-muted: "hsl(30 13% 40%)"
  memorial-revelation: "hsl(38 46% 45%)"
  memorial-prayer: "hsl(215 50% 48%)"
  memorial-testimony: "hsl(142 40% 40%)"
  memorial-altar: "hsl(215 14% 48%)"
  destructive: "hsl(2 70% 50%)"
  border: "hsl(35 23% 78%)"
typography:
  display:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  reading:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    letterSpacing: "0.02em"
  mono:
    fontFamily: "DM Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.parchment-surface}"
    textColor: "{colors.text-ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card-default:
    backgroundColor: "{colors.parchment-raised}"
    textColor: "{colors.text-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Bíblia Vive

## Overview

**Creative North Star: "O Santuário Editorial" (The Editorial Sanctuary)**

O Bíblia Vive é concebido como um refúgio digital de permanência, recolhimento e contemplação diária na Palavra de Deus. A experiência visual rejeita a agitação frenética das interfaces contemporâneas em favor de uma estética editorial refinada, calorosa e atemporal, inspirada na nobreza dos códices e livros encadernados, unida ao dinamismo silencioso da moderna engenharia web.

Aqui, o design existe em posição de serviço: ele não procura impressionar, não compete pela atenção e quase desaparece para que a Escritura Sagrada reine como o centro e sujeito ativo da experiência. A densidade visual é espaçosa e serena, com contrastes ópticos calculados para horas de leitura devocional e estudo contínuo sem fadiga visual.

Rejeitamos terminantemente convenções de aplicativos de produtividade corporativa, gamificação ruidosa de retenção (streaks vazios, confetes na tela), gradientes arroxeados clichês de IA e o hábito de embalar cada elemento em cards aninhados.

**Key Characteristics:**
- **Centralidade Bíblica:** O texto sagrado é a autoridade visual e a hierarquia suprema da tela.
- **Tipografia Nobre:** Casamento harmônico entre *Lora* (serifa editorial para leitura e títulos) e *DM Sans* (clareza funcional para interface).
- **Tonal Layering Acolhedor:** Camadas de luz e sombra natural em três temas orgânicos (Sépia, Escuro e Claro), sem preto ou cinza puros.
- **Acabamento Tátil e Reverente:** Botões com leve relevo tátil (*puffed*), bordas tênues e anéis de foco em ouro bíblico sutil.

---

## Colors

A paleta cromática do Bíblia Vive comunica reverência, sobriedade, calor humano e permanência espiritual. Todos os tons são ligeiramente aquecidos e terrosos, evitando o estresse óptico de brancos ofuscantes e pretos desprovidos de vida.

### Primary
- **Dourado Bíblico Sagrado** (`hsl(38 46% 45%)` / `#9a6e1e`): Usado com nobre parcimônia em ações principais, estados ativos de navegação, anéis de foco e no brilho sereno do Modo Clausura. Nunca satura a tela.
- **Aura Dourada / Fundo Ouro** (`hsl(40 57% 87%)` no sépia / `hsl(39 35% 25%)` no escuro): Suporte a realces sutis, badges suaves e backgrounds de elementos destacados.

### Neutral — Sépia & Pergaminho (Tema Base / Padrão)
- **Pergaminho Devocional / Fundo** (`hsl(42 32% 94%)`): Cor base do tema sépia padrão, emulando páginas antigas de livros bem cuidados.
- **Superfície do Gabinete** (`hsl(44 30% 91%)`): Painéis laterais, popovers e gavetas flutuantes.
- **Superfície Elevada / Card** (`hsl(44 26% 88%)`): Elementos de apoio e blocos delimitados.
- **Tinta Preta Envelhecida (Texto)** (`hsl(28 25% 19%)`): Tipografia primária de altíssimo contraste e conforto.
- **Tinta Amortecida (Muted)** (`hsl(30 13% 40%)`): Metadados, referências de versículo e legendas.
- **Borda de Pergaminho** (`hsl(35 23% 78%)`): Delimitação física de 1px entre componentes.

### Neutral — Noite Contemplativa (Tema Escuro)
- **Noite Contemplativa / Fundo** (`hsl(30 13% 10%)`): Preto com aquecimento âmbar/carvão, eliminando luz azul desnecessária.
- **Superfície Noturna** (`hsl(28 12% 14%)`): Superfícies de apoio no modo escuro.
- **Superfície Noturna Elevada** (`hsl(30 11% 18%)`): Cards e containers de estudo noturno.
- **Texto Branco Marfim** (`hsl(42 36% 92%)`): Texto de leitura bíblica com brilho suavizado.
- **Borda Noturna** (`hsl(30 11% 28%)`): Divisores discretos no escuro.

### Cores Canônicas do Meu Memorial
Cores com identidade teológica e visual rigorosa no registro espiritual:
- **Dourado Revelação** (`hsl(38 46% 45%)`): Reflexão bíblica (modelo SOAP).
- **Azul Prece** (`hsl(215 50% 48%)`): Oração e intercessão (com acompanhamento de resposta divina).
- **Verde Aliança** (`hsl(142 40% 40%)`): Testemunho da fidelidade de Deus na caminhada.
- **Cinza Altar** (`hsl(215 14% 48%)`): Períodos dedicados de Jejum e Propósito espiritual.

### Named Rules
- **A Regra da Centralidade da Palavra.** A Palavra de Deus é a autoridade visual máxima. Nenhum elemento de interface (botões, badges, banners, cards) pode competir em saturação ou escala visual com o texto da Escritura.
- **A Regra Anti-SaaS.** É estritamente proibido o uso de gradientes roxo-azulados, chips flutuantes apelativos de "IA Mágica", animações exibicionistas ou cards agrupados dentro de cards sem propósito funcional.
- **A Regra da Riqueza Cromática Contida.** O acento dourado nunca ocupa mais de 10% de qualquer viewport; o protagonismo cromático pertence ao papel e à tinta.

---

## Typography

**Display / Heading Font:** `Lora, Georgia, serif`  
**Body / Interface Font:** `DM Sans, system-ui, sans-serif`  
**Reading Font:** `Lora, Georgia, serif`  
**Monospace / Metadata Font:** `DM Mono, monospace`  
**Original Hebrew Font:** `Noto Serif Hebrew, serif`

**Character:** A solidez e elegância atemporal da serifa renascentista de *Lora* sustenta todo o peso espiritual da leitura e dos cabeçalhos, enquanto a precisão geométrica e moderna de *DM Sans* conduz a navegação e controles com clareza cristalina e zero ruído.

### Hierarchy
- **Display** (`weight: 600`, `size: clamp(2rem, 5vw, 3rem)`, `line-height: 1.2`): Títulos de livros bíblicos, capas de planos de leitura e heróis editoriais.
- **Headline** (`weight: 600`, `size: 1.75rem`, `line-height: 1.3`): Capítulos bíblicos e títulos de artigos teológicos.
- **Title** (`weight: 500`, `size: 1.25rem`, `line-height: 1.4`): Títulos de seções, cabeçalhos de cards e tópicos do Estúdio Homilético.
- **Reading Body** (`weight: 400`, `size: 18px` ajustável, `line-height: 1.7`): O texto bíblico principal em *Lora*. Largura de leitura contida em no máximo `860px` (`--column-width`) para garantir ritmo visual perfeito.
- **Interface Body** (`weight: 400`, `size: 1rem (16px)`, `line-height: 1.6`): Comentários, notas, artigos e textos de apoio em *DM Sans*.
- **Label / Small** (`weight: 500`, `size: 0.875rem (14px)`, `letter-spacing: 0.02em`): Botões, abas, badges de categoria e menus.
- **Micro / Compact** (`weight: 500`, `size: 0.625rem (10px)`, `letter-spacing: 0.05em`): Abas de navegação móvel, iniciais de avatar e divisores overline de gaveta.
- **Code / Lemma** (`weight: 400`, `size: 0.8125rem (13px)`): Números Strong, morfologia e metadados léxicos em *DM Mono*.

### Named Rules
- **A Regra da Leitura Ininterrupta.** O container de leitura bíblica respeita a largura ideal de 65 a 80 caracteres por linha (`max-w-[860px]`), com entrelinha aberta (`1.7`) e espaçamento entre versículos de `0.8rem`. Jamais esticar o texto bíblico até as bordas de monitores widescreen.

---

## Layout

O Bíblia Vive adota um modelo espacial responsivo centrado no leitor:
- **Container Global:** `max-w-[1400px]` centralizado para navegação, estúdio e dashboards.
- **Santuário de Leitura (Reading Well):** Coluna única centrada de `860px` de largura máxima, garantindo isolamento da visão periférica e imersão pura.
- **Modo Clausura (Exclusivo Desktop):** Estado contemplativo ativado por botão persistente no canto inferior direito; desvanece suavemente header, menus, sidebar e footer, mantendo apenas o título do capítulo fixado (`sticky top-0`) e o fluxo de leitura.
- **Espaço do Memorial:**
  - *Desktop:* Painel lateral retrátil (Sheet) que permite escrever e ditar por voz sem perder o texto bíblico de vista.
  - *Mobile:* Gaveta inferior (*bottom sheet*) ergonômica com arrasto tátil.
- **Régua de Espaçamento:** Escala de 4px (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).

---

## Elevation & Depth

O sistema prioriza a diferenciação tonal (*Tonal Layering*) em vez de sombras artificiais pesadas. Em repouso, as superfícies repousam harmoniosamente no mesmo plano óptico através de sutis variações de HSL e bordas finas de 1px.

### Shadow Vocabulary
- **Tátil Suave (`.btn-puffed`):**
  - *Sépia/Claro:* `0 2px 5px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.50)`
  - *Escuro:* `0 3px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`
  - Usado em botões principais de ação e controles interativos primários.
- **Flutuante / Modal (`shadow-lg`):** `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` para modais de dicionário Strong e dropdowns.
- **Brilho Dourado Sagrado (`.shadow-gold-glow` / `pulse-aura`):** Brilho difuso em `hsl(var(--gold) / 0.3)` reservado para o botão ativo do Modo Clausura e lembretes espirituais no caderno.

### Named Rules
- **A Regra da Calmaria em Repouso.** Superfícies em repouso são tonais e planas. Sombras pronunciadas existem apenas como resposta a elevação física direta (gavetas, modais) ou toque tátil deliberado.

---

## Shapes

- **Raios de Canto (Border Radius):**
  - *Botões e Inputs (`rounded-md`):* `6px` a `8px` (`var(--radius)`). Acolhedor sem ser infantilmente arredondado.
  - *Cards e Diálogos (`rounded-lg`):* `8px` a `12px`.
  - *Badges, Tags e Pílulas (`rounded-full`):* `9999px`.
- **Form Language:** Geometria equilibrada, cantos suavizados e ausência de cantos afiados agressivos ou arredondamentos circulares excessivos em containers grandes.

---

## Components

### Buttons
- **Shape:** `rounded-md` (`calc(var(--radius) - 2px)` / ~6px). Altura mínima acessível de `44px` (ou `h-10` / `h-11` no desktop).
- **Primary:** Fundo Dourado Bíblico (`bg-primary`), texto branco puro, efeito levemente tátil (`.btn-puffed`). Ao hover: leve translação para baixo (`translate-y-[1px]`) simulando amortecimento mecânico real.
- **Secondary / Outline:** Fundo da superfície (`bg-secondary`), borda de 1px (`border-border`), texto da tinta (`text-foreground`).
- **Ghost:** Fundo transparente, realce sutil em ouro claro no hover (`hover:bg-accent hover:text-accent-foreground`).

### Cards & Containers
- **Corner Style:** `rounded-lg` com borda sutil `1px solid hsl(var(--border))`.
- **Background:** `bg-card` (`hsl(var(--bg-raised))`).
- **Internal Padding:** `p-6` para áreas de conteúdo denso, `p-4` para widgets laterais.

### Inputs & Textareas
- **Style:** Fundo neutro elevado (`bg-input`), borda discreta, raio `rounded-md`.
- **Focus:** Sem anéis azuis padrão de navegadores. Usa `outline: 2px solid hsl(var(--ring))` com `outline-offset: 3px`, conferindo um anel dourado sutil e focado.
- **Min Height:** `min-h-[44px]` garantindo conformidade ergonômica total para toque mobile.

### Meu Memorial (Drawer & Card de Registro)
- **Categorização Visual:** Cada categoria exibe seu badge e acento exclusivo (Dourado para Reflexão SOAP, Azul para Oração, Verde para Testemunho, Cinza para Jejum).
- **Interface Híbrida de Voz:** Botão de microfone integrado na barra do editor com pulso suave de captação e preview em tempo real.

### Modo Clausura Floating Trigger
- Botão flutuante persistente no canto inferior direito (`fixed bottom-6 right-6`), discreto e translúcido em repouso, emitindo leve pulso dourado (`shadow-gold-glow`) quando ativo, permitindo ao Leitor alternar instantaneamente entre contemplação total e controles normais.

---

## Do's and Don'ts

### Do:
- **Do** priorizar a legibilidade da Palavra com tipografia serifada nobre (*Lora*) e proporções de entrelinha generosas (1.6 a 1.7).
- **Do** preservar a paleta de três temas (Sépia, Claro e Escuro), mantendo a harmonia cromática terrosa em todos eles.
- **Do** aplicar o efeito `.btn-puffed` em botões de ação principal para proporcionar sensação tátil calorosa.
- **Do** respeitar o vocabulário canônico: *Leitor*, *Visitante*, *Meu Memorial*, *Referência*, *Plano de Leitura*, *Modo Clausura*.
- **Do** garantir que elementos interativos possuam alvo de toque de no mínimo 44x44px.

### Don'ts:
- **Don't** utilizar gradientes roxos, azuis elétricos ou estéticas futuristas de IA (como partículas flutuantes ou brilhos neon).
- **Don't** usar pretos puros (`#000000`) ou brancos puros (`#ffffff`) como superfícies principais de leitura.
- **Don't** quebrar a concentração do Leitor com pop-ups agressivos, banners de marketing ou contadores de "streak" que gerem culpa ou ansiedade.
- **Don't** aninhar cards dentro de cards repetidamente. Agrupe informações por espaçamento e tipografia antes de criar novas caixas.
- **Don't** permitir que botões ou menus cubram versículos bíblicos durante a rolagem.
