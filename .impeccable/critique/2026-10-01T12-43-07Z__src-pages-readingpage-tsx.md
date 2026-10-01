---
target: hierarquia visual
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
target_identity: "file:C:\\Users\\sorai\\Desktop\\Bruno\\Projetos\\Biblia\\biblia-vive-leitura-main\\src\\pages\\ReadingPage.tsx"
target_fingerprint: "sha256:b516fde7ee04910431391bc268270b495763d3384773e90f76313cea8a399217"
target_path: "C:\\Users\\sorai\\Desktop\\Bruno\\Projetos\\Biblia\\biblia-vive-leitura-main\\src\\pages\\ReadingPage.tsx"
timestamp: 2026-10-01T12-43-07Z
slug: src-pages-readingpage-tsx
---
Method: dual-agent (A: c6bf71c5-5767-4202-a637-135d9159382c · B: ebf540da-0353-4b42-8590-0d9ee1fa1997)

### Design Health Score

| # | Heurística | Nota | Observação Principal |
|---|---|:---:|---|
| 1 | **Visibility of System Status** | **3/4** | Progresso de leitura e títulos sticky claros; ambiguidade entre Modo Foco e Modo Clausura. |
| 2 | **Match System / Real World** | **3/4** | Linguagem bíblica sólida; quebras com jargão técnico ("Difs") e ícone de faísca de IA (`Sparkles`). |
| 3 | **User Control and Freedom** | **3/4** | Excelentes atalhos de teclado (`Esc`, `F`, setas); toolbar de versículo cobre texto adjacente sem aviso. |
| 4 | **Consistency and Standards** | **2/4** | Inconsistência conceitual crítica entre `focusMode` e `isClausuraActive`, com botões flutuantes concorrentes. |
| 5 | **Error Prevention** | **3/4** | Redirecionamento suave em capítulos inexistentes; exportação de PDF aciona paywall sem aviso prévio de recurso PRO. |
| 6 | **Recognition Rather Than Recall** | **3/4** | Breadcrumb canônico exemplar; 7 botões de topo são ícones puros sem legenda visível imediata. |
| 7 | **Flexibilidade e Eficiência** | **3/4** | Atalhos ágeis e Speculation Rules API; falta de gestos swipe no mobile força rolagem completa. |
| 8 | **Aesthetic and Minimalist Design** | **1/4** | **Ponto Crítico:** Severo inchaço funcional com até 5 banners/cartões empilhados antes do versículo 1. |
| 9 | **Help Users Recognize / Recover Errors** | **3/4** | Mensagens acolhedoras e botão de recarregar em falhas de rede. |
| 10 | **Help and Documentation** | **3/4** | Página "Como Usar" rica; conceitos próprios (Fio da Escritura, Memorial) carecem de tooltips contextuais. |
| **Total** | | **27/40** | **Acceptable (Fundação sólida com sobrecarga funcional no topo)** |

---

### Design Specificity Verdict

**LLM Assessment:** A fundação estética de *O Santuário Editorial* (tipografia renascentista Lora com DM Sans, paleta pergaminho sépia e preto aquecido carvão) é autêntica e reverente. No entanto, a tela central de leitura sofre da **"Síndrome da Cabine de Avião"**: o leitor encontra um painel instrumental de até 7 botões utilitários e 5 banners concorrentes antes de alcançar a Escritura. Há contaminação por convenções de SaaS (ícone `Sparkles` para comentários e jargão de programador `"Difs"` no comparador).

**Deterministic Scan:** O detector estático identificou **20 advertências**: 19 de `design-system-font-size` (tamanhos literais arbitrários como `0.65rem`, `0.68rem`, `0.7rem`, `text-[1rem]`) e 1 de `design-system-radius` (`borderRadius: 3px`). A inspeção estrutural de código revelou ainda ternários com cores hexadecimais hardcoded (`isDark ? "bg-[#151311]" : ...`) contornando tokens semânticos, sombras pesadas (`shadow-xl`/`shadow-2xl`) e subtítulos de seção formatados como `<p aria-hidden="true">` sem nível de título semântico.

---

### Overall Impression
O leitor bíblico do Bíblia Vive possui a melhor alma tipográfica e cromática do ecossistema devocional em língua portuguesa. Contudo, seu topo foi transformado em uma vitrine concorrente de todas as funcionalidades da plataforma. O texto sagrado foi empurrado para o segundo plano visual por banners de IA, cartões de planos, botões utilitários e alertas.

---

### What's Working
1. **Atmosfera Tipográfica e Tonal Ímpar:** O casamento da Lora com espaçamento vertical de versículos ajustável e paletas quentes sem brancos puros proporciona uma experiência de leitura serena e livre de estresse visual.
2. **Navegação Canônica Fluida:** Breadcrumb contextual rápido com seletores modais responsivos e pré-renderização de capítulos adjacentes via Speculation Rules API.
3. **Poética do Modo Clausura:** A transição suave de 1s para o esvanecimento da interface deixa a Escritura isolada e contemplativa quando ativada.

---

### Priority Issues

#### [P0] Empilhamento Crônico de Banners e Cartões Pré-Escritura
- **O que é:** Concorrência simultânea de até 5 módulos verticais antes do texto bíblico (`ScriptureThreadBanner`, banner do plano de leitura, alerta de cache, `WorshipCard` e `EchoBanner`).
- **Por que importa:** O primeiro versículo da Bíblia é empurrado para fora da primeira dobra da tela.
- **Correção:** Consolidar os avisos em um único componente de sinalização contextual (`ReadingAmbientAlerts`), recolhendo Fios e Ecos para pequenas insígnias sutis ao lado do H1 ou em gaveta recolhível.
- **Comando sugerido:** `/impeccable layout`

#### [P1] Concorrência Conceitual: Modo Foco vs. Modo Clausura
- **O que é:** Existência de duas modalidades concorrentes de leitura sem distração (`preferences.focusMode` e `isClausuraActive`), com atalhos, estilos e botões flutuantes concorrentes.
- **Por que importa:** Confunde o leitor, duplica código e gera poluição no canto inferior da tela.
- **Correção:** Unificar definitivamente sob o **Modo Clausura**, ligando o atalho `F` e eliminando o botão flutuante duplicado.
- **Comando sugerido:** `/impeccable distill`

#### [P2] Cockpit de 7 Ícones Sem Agrupamento no Topo
- **O que é:** Fileira horizontal plana com 7 botões utilitários (Comparar, Player, Foco, Sumário, PDF, Modo Igreja e Configurações).
- **Por que importa:** Sobrecarga cognitiva no primeiro contato visual (violação do limite de <= 4 opções).
- **Correção:** Separar em 2 grupos: Leitura Direta (Áudio e Tradução visíveis) e Ferramentas de Estudo (recolhidas em menu popover "Opções de Leitura").
- **Comando sugerido:** `/impeccable layout`

#### [P3] Fragmentação de Tamanhos de Fonte e Cores Hardcoded
- **O que é:** 19 ocorrências de tamanhos literais fora da escala de `DESIGN.md` e ternários hexadecimais manuais em `ReadingPage.tsx`.
- **Por que importa:** Quebra o sistema de design e prejudica a consistência nos temas claro, sépia e escuro.
- **Correção:** Normalizar para tokens semânticos e documentar o degrau `micro: 0.625rem` em `DESIGN.md`.
- **Comando sugerido:** `/impeccable typeset`

#### [P3] Jargão Técnico e Clichês de IA
- **O que é:** Rótulo `"Difs"` no comparador e ícone `Sparkles` no botão de comentários exegéticos.
- **Por que importa:** Contradiz a promessa editorial de afastar clichês de IA e software de desenvolvedor.
- **Correção:** Trocar `"Difs"` por `"Destacar variações"` e `Sparkles` por `BookOpen` ou `ScrollText`.
- **Comando sugerido:** `/impeccable clarify`

---

### Persona Red Flags
- **Alex (Power User / Pastor):** Ao abrir a visualização comparativa de versões, a barra lateral de navegação de capítulos some sem alternativa rápida de troca de livro.
- **Jordan (Primeiro Contato):** Abertura de capítulo inundada por termos desconhecidos ("Fio da Escritura", "Difs", "Modo Igreja", "Memorial"), gerando paralisia por excesso de estímulos.
- **Sam (Navegação por Teclado / Leitor de Tela):** Todos os versículos possuem `tabIndex={0}`. No Salmo 119, o usuário precisa dar **176 Tabs consecutivos** para conseguir ultrapassar o texto bíblico até os controles de próximo capítulo.
- **Casey (Leitor Mobile):** Colisão de elementos fixos no rodapé (menu inferior, player de hino, botão do Modo Clausura e botão do Modo Igreja) sobrepondo a área de toque do polegar.

---

### Minor Observations
- Erro tipográfico de concatenação em `ReadingPage.tsx:1701`: `"📡 Modo OfflineAtivo"`.
- Truncamento precoce do título do livro no cabeçalho sticky em mobile (`max-w-[140px]`).
- Subtítulos de seções bíblicas renderizados como `<p aria-hidden="true">` em vez de cabeçalhos semânticos (`<h2>`).

---

### Questions to Consider
1. *Se este leitor é um "Santuário Editorial", por que permitimos que 5 alertas, banners e cards concorrentes ocupem o espaço sagrado antes mesmo de Gênesis 1:1 ser lido?*
2. *Podemos unificar o Modo Foco e o Modo Clausura em uma única experiência canônica de recolhimento espiritual?*
3. *A seleção de versículos no teclado não deveria pertencer a um atalho global navegável, em vez de transformar centenas de versículos em armadilhas de Tab para usuários de acessibilidade?*
