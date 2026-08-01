---
id: LOGOS-COMM-INTERACTION
title: INTERACTION
type: CommGuidelineNode
status: Draft
version: 1.0.0
source_file: /docs/branding/experience/INTERACTION.md
relations:
- type: referencia
  target: LOGOS-FND-CHARTER
- type: referencia
  target: LOGOS-DOM-DOMAIN
- type: referencia
  target: LOGOS-DOM-DEUS
- type: referencia
  target: LOGOS-DOM-PALAVRA
- type: referencia
  target: LOGOS-DOM-LEITOR
- type: referencia
  target: LOGOS-DOM-REFLEXO
- type: referencia
  target: LOGOS-DOM-CADERNO
- type: referencia
  target: LOGOS-DOM-MEMRIA-ESPIRITUAL
- type: referencia
  target: LOGOS-DOM-PERMANNCIA
- type: referencia
  target: LOGOS-DOM-CAMINHADA
- type: referencia
  target: LOGOS-FND-CONSTITUTION
- type: referencia
  target: LOGOS-FND-PHILOSOPHY
---
﻿---
title: INTERACTION
subtitle: Princípios de Interação da Bíblia Vive
version: 1.0.0
status: Approved
classification: Experience

owner: Founder

authors:
  - Founder
  - Chief Brand Architect

created: 2026-07-21
updated: 2026-07-21

authority-level: 7

depends-on:
  - ../00-CHARTER.md
  - ../core/PHILOSOPHY.md
  - ../core/CONSTITUTION.md
  - ../DOMAIN.md
---


# INTERACTION

> Cada interação deve aproximar o Leitor da Palavra.
>
> Nunca da interface.

---

# 1. Propósito

Este documento estabelece os padrões oficiais de interação da Bíblia Vive.

Seu objetivo é garantir que todas as interações permaneçam consistentes em qualquer funcionalidade presente ou futura.

Aplica-se a:

- Desktop
- Mobile
- Tablet
- WebApp
- Aplicativos nativos (futuro)

---

# 2. Filosofia da Interação

Toda interação deve ser:

- natural;
- previsível;
- silenciosa;
- reversível;
- consistente.

A interface nunca deve exigir que o Leitor aprenda um comportamento diferente para realizar ações semelhantes.

---

# 3. A Leitura é o Estado Natural

Sempre que possível, o Leitor deve permanecer na tela da Bíblia.

Não criamos mudanças de contexto desnecessárias.

Toda interação parte da leitura e retorna para ela.

---

# 4. Continuidade da Leitura

Nenhuma ação deve fazer o Leitor perder:

- posição;
- capítulo;
- versículo;
- seleção;
- contexto.

Ao concluir qualquer ação, o foco retorna naturalmente para a leitura.

---

# 5. Seleção de Versículos

A seleção deve ser:

- rápida;
- precisa;
- previsível.

Ao selecionar um ou mais versículos, as ações disponíveis devem aparecer de forma contextual, sem ocultar o conteúdo bíblico.

---

# 6. Menu Contextual

O menu contextual existe apenas quando há contexto.

Ele deve oferecer somente ações relevantes ao elemento selecionado.

Nunca apresentar funcionalidades irrelevantes.

---

# 7. Destaques

Destacar um versículo deve ser imediato.

O destaque deve confirmar visualmente a ação sem interromper a leitura.

Sempre permitir:

- editar;
- alterar cor;
- remover.

---

# 8. O Caderno

O Caderno nunca representa uma mudança de ambiente.

Ele amplia a experiência da leitura.

Ao criar uma anotação:

- o versículo permanece visível;
- a referência permanece acessível;
- o retorno à leitura é imediato.

---

# 9. Fluxo de Reflexão

A sequência natural é:

```text
Selecionar

↓

Refletir

↓

Registrar

↓

Continuar lendo
```

Jamais:

```text
Selecionar

↓

Abrir nova página

↓

Perder contexto

↓

Retornar manualmente
```

---

# 10. Navegação

Toda navegação deve respeitar:

- menor quantidade possível de ações;
- previsibilidade;
- consistência entre telas.

Sempre que possível:

- voltar retorna exatamente ao estado anterior;
- fechar preserva contexto;
- cancelar não produz efeitos colaterais.

---

# 11. Gestos (Mobile)

Os gestos devem complementar a interface.

Nunca substituí-la.

Todo gesto importante deverá possuir alternativa visível.

Exemplos:

- toque;
- toque prolongado;
- arrastar;
- deslizar.

---

# 12. Atalhos (Desktop)

Atalhos aceleram a experiência.

Nunca são obrigatórios.

Toda funcionalidade acessível por teclado deve possuir equivalente visual.

---

# 13. Feedback Visual

Toda ação importante deve gerar confirmação.

Exemplos:

- anotação salva;
- destaque criado;
- sincronização concluída;
- PDF exportado.

O feedback deve ser:

- discreto;
- imediato;
- temporário.

---

# 14. Feedback de Longa Duração

Operações demoradas devem informar:

- progresso;
- estado atual;
- conclusão;
- falha.

Nunca deixar o Leitor aguardando sem contexto.

---

# 15. Estados Vazios

Cada estado vazio deve ensinar.

Exemplo:

"O seu Caderno ainda está vazio."

↓

"Comece registrando aquilo que Deus lhe ensinar durante a leitura."

A ausência torna-se convite.

---

# 16. Mensagens

Toda mensagem deve ser:

- respeitosa;
- clara;
- objetiva.

Evitar:

- linguagem técnica;
- culpa;
- urgência artificial.

---

# 17. Erros

Um erro deve responder três perguntas:

- O que aconteceu?
- Por que aconteceu?
- Como resolver?

Nunca expor detalhes técnicos ao Leitor.

---

# 18. Sincronização

Sempre que possível:

A sincronização acontece silenciosamente.

O Leitor só deve ser informado quando:

- houver conflito;
- houver falha;
- sua ação for necessária.

---

# 19. Offline

A ausência de conexão não deve impedir:

- leitura;
- consulta ao histórico disponível;
- escrita no Caderno.

A sincronização ocorrerá automaticamente quando possível.

---

# 20. Inteligência Artificial

A IA nunca interrompe.

Nunca abre diálogos espontaneamente.

Nunca sobrepõe conteúdo bíblico.

Ela aparece somente quando:

- solicitada;
- contextual;
- claramente útil.

---

# 21. Modais

Utilizar modais apenas quando:

- exigir decisão;
- impedir perda de dados;
- solicitar confirmação importante.

Evitar utilizá-los para conteúdo informativo.

---

# 22. Sheets

Sempre que possível, preferir Sheets aos modais.

Eles preservam melhor a sensação de continuidade da leitura.

---

# 23. Diálogos de Confirmação

Solicitar confirmação apenas para ações irreversíveis.

Exemplos:

- excluir anotação;
- apagar Caderno;
- remover registros.

Não solicitar confirmação para ações facilmente reversíveis.

---

# 24. Estados de Foco

O Leitor deve saber claramente onde está.

Especial atenção para:

- teclado;
- acessibilidade;
- navegação por TAB.

---

# 25. Microinterações

Toda microinteração deve responder a uma necessidade funcional.

Nunca utilizar animações apenas para impressionar.

A melhor animação é aquela que ajuda a compreender o estado da interface.

---

# 26. Continuidade entre Sessões

Ao retornar à Bíblia Vive, o Leitor deve sentir que sua caminhada continuou.

A plataforma deve restaurar:

- leitura;
- contexto;
- Caderno;
- progresso.

---

# 27. Critérios para Novas Interações

Antes de implementar qualquer interação, perguntar:

- mantém a leitura como centro?
- reduz atrito?
- preserva contexto?
- fortalece o Caderno?
- respeita a Permanência?
- mantém consistência?

Se qualquer resposta for negativa, a solução deverá ser reavaliada.

---

# 28. Declaração Final

Cada clique.

Cada toque.

Cada gesto.

Cada atalho.

Cada animação.

Cada confirmação.

Tudo existe para preservar um único fluxo:

Leitura.

Compreensão.

Reflexão.

Registro.

Memória Espiritual.

Retorno à Palavra.

Quando uma interação interrompe esse fluxo, ela deixa de servir à missão da Bíblia Vive.