# 10. Modo Clausura — Inatividade Contemplativa na Leitura Bíblica

* Status: Aceito
* Data: 2026-08-10

## Contexto e Problema

A Bíblia Vive tem por filosofia ser um refúgio de permanência. Quando o leitor pausa a interação na tela de leitura (`ReadingPage`), ele entrou em meditação. A presença ostensiva de elementos de interface (cabeçalho, rodapé, barra de navegação móvel, seletores de versão, menus e botões flutuantes) concorre com a Palavra e gera ruído cognitivo.

## Decisões de Arquitetura

1. **Hook Customizado `useInactivity`:**
   - Temporizador de inatividade configurado para exatamente 30 segundos (30.000 ms).
   - O temporizador é resetado a cada evento de interação.
   - Restauração instantânea (`duration-0`) da interface ao detectar:
     - Movimento do mouse no desktop com deslocamento significativo (> 10px).
     - Toque em dispositivos móveis (`touchstart`).
     - Clique de mouse (`mousedown`).
     - Pressionamento de tecla (`keydown`).
   - A ação de rolar a página (`scroll`) **NÃO** encerra o Modo Clausura, permitindo ao leitor rolar o texto bíblico sem trazer de volta os elementos visuais periféricos.

2. **Condições de Bloqueio (Invalidação da Clausura):**
   - O Modo Clausura **NUNCA** é ativado se houver:
     - Qualquer modal aberto (estudo, nota, compartilhamento, autenticação, etc.).
     - O Painel de Estudo (`StudyPanel`) aberto.
     - Um versículo selecionado (barra `VerseToolbar` visível).
     - Tocador de áudio em reprodução (`AudioPlayer` ou TTS ativo).

3. **Desvanecimento Solene sem Reflow:**
   - Aplicação de classes Tailwind com transição lenta de opacidade (`transition-opacity duration-1000 opacity-0 pointer-events-none`) nos elementos periféricos (`header`, `footer`, `nav` móvel e controles secundários da página).
   - Restauração com `duration-0` / opacidade 100% imediata ao interagir.
   - O container do texto bíblico permanece rigorosamente na mesma posição e com o mesmo layout, sem nenhum cálculo ou reflow de CSS.

4. **Escopo do Botão Flutuante Global:**
   - O botão flutuante global (`GlobalNotebookContainer`) permanece visível na tela por pertencer à camada de aplicativo global, concentrando a Clausura apenas nos elementos estruturais da rota de leitura.

## Consequências

- Experiência imersiva e silenciosa voltada para meditação e leitura prolongada.
- Preservação da acessibilidade e usabilidade: qualquer intenção ativa de interação (moção de mouse > 10px, clique, toque) traz a interface de volta instantaneamente sem latência perceptível.
- Prevenção de cliques acidentais em botões invisíveis através da propriedade `pointer-events-none`.
