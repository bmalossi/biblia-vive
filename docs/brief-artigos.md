# Brief: Sistema de Artigos + Admin + SEO (Prerender)

## Problema

O BibliaVive atualmente não possui uma infraestrutura dedicada para publicação de artigos, o que impede a criação de páginas indexáveis e otimizadas para SEO.

Por ser um SPA (React + Vite), o conteúdo não é entregue de forma indexável para crawlers, e não existe um fluxo estruturado para:

- criação de artigos via painel administrativo
- gerenciamento de metadados SEO por página
- geração de rotas estáticas por conteúdo publicado
- distribuição de conteúdo na home (carrossel)

Com isso, o sistema não está preparado para receber artigos de forma escalável e otimizada para buscadores.

---

## Impacto

- Artigos não podem ser indexados corretamente pelo Google
- Conteúdo publicado não aparece em buscas orgânicas
- Perda de oportunidade de aquisição de tráfego
- Falta de estrutura para escalar conteúdo (centenas de páginas)
- Home não promove descoberta de conteúdo (sem carrossel de artigos)
- Recursos avançados do site não são explorados via conteúdo

---

## Restrição

- Manter arquitetura atual (React + Vite SPA)
- Deploy na Vercel (sem servidor dedicado)
- Não impactar funcionalidades existentes (Supabase, autenticação, etc.)
- Garantir compatibilidade com prerender estático
- Não degradar performance do site
- Estrutura deve suportar crescimento escalável de conteúdo

---

## Hipótese de solução

Implementar uma infraestrutura que permita a publicação manual de artigos via painel administrativo, com suporte completo a SEO e prerender estático.

A solução deve contemplar:

- Criação de um painel admin para cadastro e edição de artigos
- Definição de campos essenciais: título, slug, descrição e conteúdo
- Possibilidade de configurar metadados SEO por artigo (title e description)
- Criação de rotas dinâmicas (`/artigos/[slug]`) para cada conteúdo publicado
- Geração de HTML estático por artigo durante o build (prerender)
- Atualização automática das rotas com base nos artigos publicados
- Inclusão de uma seção na home com carrossel de artigos, exibindo conteúdos em destaque ou mais recentes
- Estrutura preparada para interlinking interno entre artigos e páginas existentes

Essa abordagem permitirá que o site esteja totalmente preparado para receber artigos de forma escalável, com páginas indexáveis, performáticas e otimizadas para mecanismos de busca.
