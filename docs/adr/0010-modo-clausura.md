# 10. Modo Clausura — Botão Flutuante Persistente de Contemplação (Desktop)

* Status: Aceito (Atualizado em 2026-09-17)
* Data: 2026-08-10

## Contexto e Problema

A Bíblia Vive busca proporcionar um ambiente de leitura pura e livre de distrações visuais. Para oferecer controle total ao leitor de desktop sem dependência de algoritmos de inatividade automática, o Modo Clausura evoluiu para um acionamento manual direto via botão flutuante.

## Decisões de Arquitetura

1. **Acionamento Manual via Botão Flutuante (Desktop Only):**
   - O Modo Clausura passa a ser ativado/desativado estritamente por controle manual do usuário (toggle ON/OFF).
   - O botão flutuante é exclusivo para telas desktop (`hidden md:flex`) e fica posicionado no canto inferior direito (`md:bottom-20 md:right-6`), situado exatamente acima do botão do Caderno (`md:bottom-6 md:right-6`).
   - O botão permanece **persistente** e **visível** (`z-50`) mesmo quando o Modo Clausura está ativo, permitindo ao leitor desativá-lo a qualquer instante com um clique.

2. **Desvanecimento Solene dos Elementos Periféricos:**
   - Ao ativar o Modo Clausura (`isClausuraActive = true`), aplicam-se as classes de opacidade e pointer-events (`transition-opacity duration-1000 opacity-0 pointer-events-none`) aos elementos periféricos de interface (`header`, `footer`, menus e a barra lateral `aside` de capítulos e comentários).
   - O container do texto bíblico permanece estático, sem qualquer reflow de CSS ou alteração estrutural.

3. **Inexistência de Timer de Inatividade Automática:**
   - O temporizador de inatividade e os event listeners de detecção automática foram substituídos pela gestão de estado explícita do toggle, eliminando desvanecimentos involuntários.

## Consequências

- Controle manual imediato e previsível para o leitor de desktop.
- Experiência limpa e sobria, com botão de acionamento discreto no canto inferior direito.
- Preservação do alinhamento e layout estático da página de leitura.
