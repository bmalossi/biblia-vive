# Issue #010 — UI: Modo Clausura na Tela de Leitura (`useInactivity`)

**Tipo**: Feature / UX Imersiva  
**PRD**: [prd-modo-clausura.md](../prd-modo-clausura.md)  
**ADR**: [0010-modo-clausura.md](../adr/0010-modo-clausura.md)  
**Status**: ready-for-agent  

## What to build

Implementar o **Modo Clausura** na tela de leitura (`ReadingPage.tsx`):
1. Criar o hook customizado `useInactivity.ts` para temporizador de 30 segundos com controle de movimento significativo do mouse (>10px), suporte a toque/clique/tecla e exclusão do evento de scroll.
2. Integrar com `Layout.tsx` e `ReadingPage.tsx` para aplicar desvanecimento de opacidade suave (`duration-1000 opacity-0 pointer-events-none`) aos elementos periféricos de interface.
3. Desabilitar a ativação quando modais, Painel de Estudo, `VerseToolbar` (versículo selecionado) ou tocador de áudio estiverem ativos.

## Acceptance criteria

- [ ] Hook `useInactivity` gerencia timer de 30.000 ms e reseta a cada evento de interação válido
- [ ] Movimento do mouse < 10px é ignorado (não reseta o timer de inatividade)
- [ ] Movimento do mouse > 10px, toque (`touchstart`), clique (`mousedown`) e tecla (`keydown`) restauram a UI instantaneamente (`duration-0`)
- [ ] Scroll (`scroll`) **NÃO** restaura a interface e não reseta o timer do Modo Clausura
- [ ] Modo Clausura **NÃO** ativa se houver modais abertos, `StudyPanel` aberto, `VerseToolbar` ativa ou áudio tocando
- [ ] Header, footer, nav móvel e barras de controle secundárias desvanecem com `duration-1000 opacity-0 pointer-events-none`
- [ ] O texto bíblico não sofre alteração de layout ou posição
- [ ] Botão flutuante global (`GlobalNotebookContainer`) permanece visível
- [ ] Suporte a testes unitários com Vitest (`useInactivity.test.ts`)
- [ ] `npx tsc --noEmit` passa sem erros
