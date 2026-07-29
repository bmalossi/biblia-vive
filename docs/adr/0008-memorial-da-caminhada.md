# 8. Memorial da Caminhada — Evolução do Caderno da Bíblia Vive

* Status: Aceito
* Data: 2026-07-29

## Contexto e Problema

O Caderno da Bíblia Vive (anteriormente restrito a notas por versículo em `user_notes`) necessita evoluir para se tornar o **Memorial da Caminhada** (`Meu Memorial`).
O objetivo é transformar o registro bíblico em um lugar onde o leitor preserva memórias espirituais ao longo dos anos, categorizadas em **Reflexão** (SOAP), **Oração**, **Testemunho** e **Jejum / Propósito**, sem interromper a leitura bíblica.

## Decisões de Arquitetura

1. **Evolução da Tabela `user_notes`:**
   - Remover a restrição `UNIQUE (user_id, book_id, chapter, verse)` para permitir múltiplos registros por capítulo/versículo.
   - Tornar a coluna `verse` opcional (`INTEGER NULL`) para permitir registros em nível de capítulo.
   - Adicionar as colunas `type` (`reflection` | `prayer` | `testimony` | `fasting`), `title`, `status`, `favorite`, `answered_at`, `answered_note`, `tags` (`text[]`), e `metadata` (`jsonb`).
   - Migrar registros existentes com `type = 'reflection'`.

2. **Extensibilidade via `metadata` (JSONB):**
   - Armazenar os campos estruturados de cada template (ex: campos SOAP para Reflexões; Motivo, Pedido e Entrega para Orações; O que aconteceu e Como Deus sustentou para Testemunhos; Objetivo e Datas para Jejuns) dentro do campo `metadata` JSONB.
   - Preservar busca rápida e indexação pelas colunas principais (`type`, `title`, `content`, `tags`, `book_id`, `chapter`).

3. **UX de Leitura Não-Interruptiva (FAB Expansível):**
   - Substituir o botão flutuante anterior por um Floating Action Button (FAB) expansível com menu de 4 escolhas estilizado nas cores institucionais (Dourado, Azul discreto, Verde suave, Cinza ardósia).
   - O registro abre em modal/sheet sem navegar para fora da leitura e captura automaticamente o contexto do livro, capítulo, versículo (se selecionado) e versão bíblica.

4. **Consolidação na Rota `/memorial`:**
   - Apresentar ao usuário como **"Meu Memorial"** (`/memorial`).
   - Redirecionar a rota antiga `/minhas-notas` para `/memorial`.
   - Exibir os registros em uma Linha do Tempo da Caminhada fluída com busca em tempo real e filtros por categoria.

## Consequências

- Preservação total de todo o histórico existente dos leitores.
- Preparação da arquitetura para recursos futuros (anexos, áudio, fotos, exportação em PDF e mapa espiritual).
- Manutenção da leveza e sobriedade visual da Bíblia Vive.
