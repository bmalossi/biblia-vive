# Payload e Escopo do Modelo JEV no Estúdio Homilético

## Contexto
A especificação original do Projeto Logos mencionava a infraestrutura do Modelo JEV com Seleção Híbrida Tripla de 30 notas do Memorial e cache por versão do caderno, herdada do recurso *Fio da Escritura* (ADR-0012/0013). Avaliar um sermão injetando 30 notas pessoais aleatórias da caminhada do leitor causaria poluição de contexto (*context-rot*), inflaria custos e latência de tokens e desviaria o foco da auditoria doutrinária.

## Decisão
O modelo JEV no Estúdio Homilético opera com um payload estrito e autocontido, desvinculado das notas do Memorial do pregador:

1. **Escopo Exclusivo:** A Seleção Híbrida Tripla (30 notas) pertence unicamente ao *Fio da Escritura*. O Estúdio Homilético não carrega nem envia notas históricas do leitor.
2. **Payload Canônico do Sermão:** O estado enviado ao JEV avalia exclusivamente a coerência entre o texto sagrado e o esboço construído:
   - `biblical_passage_text`: O texto bíblico oficial da perícope base.
   - `sermon_initial_spark`: A faísca espiritual inicial ("Eu e Deus").
   - `sermon_intended_outcome`: O Desfecho Homilético intencional (Marcha-Ré).
   - `sermon_block_1_exegesis`: O conteúdo do Bloco 1 (Explicar o Texto).
   - `sermon_block_2_topics`: Os Tópicos ativos do Bloco 2 com seus respectivos 4 Degraus (A, B, C, D).
   - `sermon_block_3_application`: O conteúdo do Bloco 3 (Aplicar à Vida Real).
3. **Divisão de Responsabilidades (RAG vs JEV):** Os comentários históricos (Matthew Henry, Albert Barnes, John Gill) são recuperados via RAG na fase de estudo do Bloco 1. O JEV atua como motor *System One* tipado, avaliando centralidade na Graça e detecção de desvios doutrinários (Gálatas 1:8) diretamente sobre o esboço final.

## Consequências
- Tempo de resposta do JEV abaixo de 300 ms na Edge.
- Precisão cirúrgica no cálculo da primitiva `Noul` (`is_grace_centered`) e da primitiva `Choice` (`theological_deviation`).
- Zero contaminação por notas pessoais ou desvios de tópicos não relacionados à perícope pregada.
