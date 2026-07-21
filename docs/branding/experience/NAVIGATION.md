---
title: NAVIGATION
subtitle: Navegação da Bíblia Vive
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


# NAVIGATION

> O Leitor nunca deve precisar aprender a navegar.
>
> Deve apenas continuar sua caminhada na Palavra.

---

# 1. Propósito

Este documento estabelece os princípios oficiais de navegação da Bíblia Vive.

Seu objetivo é garantir que toda navegação preserve o contexto da leitura, reduza atritos e permita que o Leitor encontre qualquer recurso de forma intuitiva.

A navegação existe para servir à leitura.

Nunca para competir com ela.

---

# 2. Princípio Central

Toda navegação deve responder a uma única pergunta:

> "Como manter o Leitor o mais próximo possível da Palavra?"

Quanto menor a distância entre intenção e ação, melhor a navegação.

---

# 3. A Leitura é o Ponto de Partida

Toda navegação começa na leitura e deve retornar naturalmente para ela.

Nenhuma funcionalidade deve transformar a leitura em um destino secundário.

A Bíblia permanece como a tela principal da aplicação.

---

# 4. Fluxo Principal

```text
          Palavra
             │
             ▼
         Leitura
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
 Compreensão Caderno Busca
      │      │      │
      └──────┼──────┘
             ▼
      Retorno à Leitura
```

Todos os fluxos convergem novamente para a leitura.

---

# 5. Profundidade Máxima

A navegação deve evitar estruturas excessivamente profundas.

Sempre que possível:

- até 2 níveis de profundidade para ações frequentes;
- até 3 níveis para funcionalidades especializadas.

Se um recurso exigir mais do que isso, sua arquitetura deve ser reavaliada.

---

# 6. Continuidade de Contexto

Ao navegar, o Leitor nunca deve perder:

- livro;
- capítulo;
- versículo;
- posição de leitura;
- seleção ativa;
- contexto do Caderno.

Toda navegação deve preservar esse estado.

---

# 7. Navegação por Intenção

A organização da navegação deve refletir a intenção do Leitor.

Exemplos:

- Quero ler.
- Quero compreender.
- Quero registrar.
- Quero encontrar.
- Quero revisar.

Nunca organizar funcionalidades pela estrutura técnica da aplicação.

---

# 8. Navegação Contextual

Recursos devem surgir apenas quando forem relevantes ao contexto atual.

Exemplos:

- menu após seleção de versículos;
- ações do Caderno relacionadas ao texto aberto;
- recursos de estudo vinculados ao trecho em leitura.

Evita-se menus permanentes com excesso de opções.

---

# 9. Navegação entre Livros

A mudança entre livros, capítulos e versículos deve ser rápida, previsível e consistente.

O Leitor deve alcançar qualquer trecho das Escrituras com o menor número possível de ações.

---

# 10. Busca como Navegação

A busca não é apenas uma ferramenta.

Ela também é um mecanismo de navegação.

Toda busca deve conduzir diretamente ao contexto encontrado, preservando a possibilidade de retorno ao ponto de origem.

---

# 11. Histórico

A navegação deve preservar memória.

O Leitor deve conseguir retornar facilmente aos conteúdos recentemente visitados, sem reconstruir manualmente seu caminho.

---

# 12. Referências Cruzadas

Ao navegar para uma referência cruzada:

- preservar o texto de origem;
- facilitar o retorno;
- indicar claramente a mudança de contexto.

Explorar referências deve ampliar a leitura, nunca fragmentá-la.

---

# 13. Navegação do Caderno

O Caderno acompanha a leitura.

Jamais substitui a leitura.

Sempre que possível, suas interações devem ocorrer em painéis, sheets ou áreas contextuais que preservem a visualização das Escrituras.

---

# 14. Desktop e Mobile

A lógica de navegação deve ser a mesma em todas as plataformas.

Mudanças de layout não devem alterar o modelo mental do Leitor.

O usuário deve reconhecer imediatamente onde está e como prosseguir.

---

# 15. Retorno

A ação de voltar deve ser absolutamente previsível.

Ela deve restaurar:

- posição;
- contexto;
- seleção;
- estado anterior.

O retorno nunca deve surpreender.

---

# 16. Persistência

Ao interromper uma sessão, a Bíblia Vive deve preservar:

- local da leitura;
- navegação recente;
- contexto do Caderno;
- progresso do Leitor.

Retomar a leitura deve parecer uma continuação, não um recomeço.

---

# 17. Navegação e Acessibilidade

Toda navegação deve ser plenamente utilizável por:

- teclado;
- leitores de tela;
- tecnologias assistivas;
- navegação por foco.

Nenhum caminho pode depender exclusivamente de gestos.

---

# 18. Critérios para Novos Fluxos

Antes de criar um novo fluxo de navegação, responder:

- reduz ou aumenta a complexidade?
- mantém a leitura como centro?
- preserva o contexto?
- evita mudanças desnecessárias de tela?
- pode ser aprendido naturalmente?
- respeita os documentos do Projeto Logos?

Se qualquer resposta for negativa, o fluxo deverá ser reavaliado.

---

# 19. Antipadrões

Evitar:

- múltiplos caminhos para a mesma ação sem necessidade;
- navegação circular;
- telas sem saída clara;
- perda de contexto;
- excesso de menus;
- modais em sequência;
- interrupções da leitura;
- redirecionamentos inesperados.

---

# 20. Definição de Boa Navegação

Uma boa navegação é aquela em que o Leitor nunca precisa pensar sobre ela.

Toda energia mental deve permanecer disponível para aquilo que realmente importa:

A Palavra de Deus.

---

# Declaração Final

A navegação da Bíblia Vive não conduz pessoas por telas.

Ela acompanha pessoas em sua caminhada com Deus.

Quando navegar parece tão natural quanto virar a página de uma Bíblia física, a experiência alcançou seu objetivo.