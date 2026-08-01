---
id: LOGOS-COMM-UX_PRINCIPLES
title: UX_PRINCIPLES
type: CommGuidelineNode
status: Draft
version: 1.0.0
source_file: /docs/branding/experience/UX_PRINCIPLES.md
relations: []
---
﻿---
title: UX_PRINCIPLES
subtitle: Princípios de UX da Bíblia Vive
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


# UX_PRINCIPLES

> A interface da Bíblia Vive não existe para ser admirada.
>
> Existe para desaparecer diante das Escrituras.

---

# 1. Propósito

Este documento estabelece os princípios oficiais de Experiência do Usuário (UX) da Bíblia Vive.

Seu objetivo é garantir que toda evolução da plataforma preserve uma experiência consistente, previsível e centrada na permanência do Leitor na Palavra de Deus.

Este documento complementa:

- DOMAIN.md
- PHILOSOPHY.md
- CONSTITUTION.md
- PRINCIPLES.md

Enquanto esses documentos definem **por que** a experiência existe, este documento define **como ela deve acontecer**.

---

# 2. Objetivo da Experiência

A Bíblia Vive não busca maximizar tempo de tela.

Busca maximizar qualidade do encontro entre o Leitor e as Escrituras.

Toda decisão de UX deverá reduzir distrações e aumentar a permanência.

---

# 3. O Fluxo Principal

Toda arquitetura da interface parte de um único fluxo.

```text
Leitura

↓

Compreensão

↓

Reflexão

↓

Registro

↓

Memória Espiritual

↓

Nova Leitura
```

Nenhuma funcionalidade deverá interromper esse ciclo.

---

# 4. Princípio da Leitura Contínua

A leitura bíblica é o estado natural da aplicação.

Todo recurso complementar deve preservar esse contexto.

O Leitor nunca deve sentir que abandonou a Palavra para utilizar outra funcionalidade.

---

# 5. O Caderno é Contextual

O Caderno não é um módulo independente.

Ele faz parte da leitura.

Registrar uma reflexão deve exigir o menor número possível de ações.

A escrita deve acontecer mantendo o contexto do texto bíblico.

---

# 6. Hierarquia da Atenção

A atenção do Leitor deve seguir sempre esta ordem:

```text
Palavra

↓

Reflexão

↓

Recursos de apoio

↓

Controles da interface
```

A interface nunca deverá competir visualmente com o conteúdo bíblico.

---

# 7. Progressividade

Recursos avançados devem aparecer apenas quando necessários.

O produto deve crescer junto com o Leitor.

A simplicidade para iniciantes não pode limitar a profundidade para usuários experientes.

---

# 8. Navegação

A navegação deve ser:

- previsível;
- consistente;
- memorável;
- reversível.

O Leitor nunca deve sentir-se perdido.

Sempre deverá existir um caminho claro de retorno.

---

# 9. Consistência

Componentes equivalentes devem possuir comportamento equivalente.

Botões.

Menus.

Modais.

Sheets.

Cards.

Ícones.

Atalhos.

Todos devem seguir padrões únicos.

---

# 10. Baixa Carga Cognitiva

A interface deve exigir o mínimo possível de esforço mental.

Evitamos:

- excesso de opções;
- decisões desnecessárias;
- múltiplas ações para uma mesma tarefa;
- elementos decorativos sem função.

---

# 11. Performance Percebida

Performance faz parte da experiência.

O Leitor nunca deve esperar sem compreender o que está acontecendo.

Sempre que possível:

- respostas imediatas;
- carregamentos progressivos;
- feedback visual;
- transições discretas.

---

# 12. Microinterações

Microinterações existem para confirmar ações.

Nunca para chamar atenção.

Toda animação deve possuir finalidade funcional.

---

# 13. Feedback

Toda ação relevante deve gerar retorno.

Exemplos:

- destaque salvo;
- anotação criada;
- sincronização concluída;
- exportação realizada.

O feedback deve ser discreto e imediato.

---

# 14. Estados Vazios

Estados vazios devem orientar.

Jamais frustrar.

Cada ausência representa uma oportunidade de ensinar.

Nunca apenas informar que não existem dados.

---

# 15. Erros

Mensagens de erro devem:

- explicar;
- orientar;
- permitir recuperação.

Nunca responsabilizar o Leitor.

---

# 16. Tipografia

A tipografia deve favorecer leitura prolongada.

Prioridades:

1. legibilidade;
2. conforto visual;
3. ritmo de leitura;
4. contraste adequado;
5. consistência.

Nunca utilizar estilos que prejudiquem a concentração.

---

# 17. Cores

As cores possuem função comunicativa.

Nunca decorativa.

Cada cor deve possuir significado consistente.

O destaque visual pertence à Palavra.

Não à interface.

---

# 18. Espaçamento

O espaço em branco faz parte da experiência.

Ele reduz fadiga.

Melhora compreensão.

Favorece concentração.

Espaços não são áreas desperdiçadas.

São áreas de respiração visual.

---

# 19. Acessibilidade

Toda funcionalidade deverá ser utilizável por pessoas com diferentes capacidades.

Incluindo:

- navegação por teclado;
- leitores de tela;
- contraste adequado;
- áreas de toque confortáveis;
- escalabilidade tipográfica.

A acessibilidade não será tratada como melhoria futura.

É requisito de projeto.

---

# 20. Responsividade

A experiência deve permanecer consistente em:

- celular;
- tablet;
- desktop.

Mudanças de layout nunca devem alterar a lógica de funcionamento.

---

# 21. Continuidade

O Leitor deve poder interromper sua leitura e retomá-la posteriormente sem perder contexto.

A plataforma deve preservar:

- posição;
- progresso;
- destaques;
- reflexões;
- histórico.

---

# 22. Inteligência Artificial

A IA ocupa posição de apoio.

Ela jamais interrompe a leitura.

Jamais abre diálogos espontaneamente.

Jamais compete pela atenção.

Ela aparece somente quando solicitada ou quando uma sugestão contextual agregar valor evidente.

---

# 23. Critérios para Novas Funcionalidades

Antes da implementação de qualquer recurso, responder:

- reduz atrito?
- fortalece a leitura?
- fortalece a compreensão?
- fortalece o Caderno?
- fortalece a Memória Espiritual?
- preserva a serenidade?
- mantém consistência?
- respeita a arquitetura existente?

Se qualquer resposta for negativa, a solução deverá ser reavaliada.

---

# 24. Critérios para Revisão de Pull Requests

Toda alteração de interface deverá verificar:

- consistência visual;
- consistência comportamental;
- impacto na leitura;
- impacto no Caderno;
- impacto na acessibilidade;
- impacto na performance;
- aderência aos componentes existentes;
- aderência aos princípios do Projeto Logos.

---

# 25. Definição de Boa Experiência

Uma experiência bem projetada é aquela em que o Leitor termina sua leitura lembrando-se da Palavra.

Não da interface.

---

# Declaração Final

Cada tela da Bíblia Vive deve comunicar silenciosamente a mesma mensagem:

"A tecnologia está aqui para servir.

A Palavra permanece no centro."