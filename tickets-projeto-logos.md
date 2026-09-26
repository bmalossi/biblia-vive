# Tickets: Projeto Logos — Estúdio Homilético 3x4, Modo Púlpito e Guardião do Evangelho (Gálatas 1:8)

Implementação da oficina homilética, persistência no Cloudflare D1, modo púlpito com Screen Wake Lock e auditoria doutrinária via Modelo JEV.
Referência: [Issue #25 (Spec)](https://github.com/bmalossi/biblia-vive/issues/25) | [spec-projeto-logos-estudio-homiletico.md](file:///C:/Users/sorai/Desktop/Bruno/Projetos/Biblia/biblia-vive-leitura-main/docs/specs/spec-projeto-logos-estudio-homiletico.md)

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

---

## Ticket 1: Tracer Bullet — Semente no Memorial, Schema D1 e Shell do Estúdio ([#26](https://github.com/bmalossi/biblia-vive/issues/26))

**What to build:** O Leitor Templo registra uma Inspiração Homilética no Meu Memorial com validação de captura do fluxo espiritual (mínimo de 3 a 5 linhas). Na nota do Memorial, um botão visual `[ 🏛️ Desenvolver no Estúdio 3x4 ]` chama o Cloudflare Worker de persistência com o JWT do Supabase, inicializa um registro de Sermão no Cloudflare D1 vinculado ao `inspiration_note_id` e navega para a página do Estúdio em `/estudio/[sermonId]`, exibindo a semente espiritual no topo (bloco 'Eu e Deus').

**Blocked by:** None — can start immediately.

- [x] Categoria `inspiration` adicionada ao Meu Memorial com validação mínima de 3 a 5 linhas de texto reflexivo.
- [x] Schema inicial de `sermons` criado no Cloudflare D1 com campos essenciais (`id`, `user_id`, `inspiration_note_id`, `title`, `status`, `created_at`, `updated_at`).
- [x] Endpoint do Cloudflare Worker para criação e recuperação de sermão validando JWT do Supabase e filtrando por `user_id`.
- [x] Botão `[ 🏛️ Desenvolver no Estúdio 3x4 ]` visível em notas de `inspiration` no Memorial que dispara a criação no D1 e redireciona.
- [x] Página do Estúdio em `/estudio/[sermonId]` renderiza o cabeçalho exibindo o texto original capturado no 'Eu e Deus'.
- [x] Testes de integração cobrindo a transição do Memorial ao Estúdio e o contrato de autorização do Worker.

---

## Ticket 2: Método da Marcha-Ré e Desbloqueio Progressivo no Estúdio ([#27](https://github.com/bmalossi/biblia-vive/issues/27))

**What to build:** No gabinete de preparação do Estúdio Homilético, o fluxo de redação impõe a metodologia inversa da Marcha-Ré. Os blocos subsequentes (Bloco 1, Bloco 2, Bloco 3 e Introdução) nascem bloqueados com indicação pedagógica. O pregador deve compulsoriamente selecionar o tipo de Desfecho Homilético (Consolação, Confronto, Conversão ou Oração) e preencher o texto da conclusão pretendida. Ao salvar o Desfecho, os blocos seguintes são desbloqueados e persistem no Cloudflare D1, garantindo total liberdade para revisões e edições retroativas a qualquer momento.

**Blocked by:** [#26](https://github.com/bmalossi/biblia-vive/issues/26)

- [x] Seletor das 4 categorias de Desfecho Homilético (Consolação, Confronto, Conversão, Oração) com campo de texto da chegada pretendida.
- [x] Estado inicial do Estúdio mantém Bloco 1, Bloco 2, Bloco 3 e Introdução bloqueados até o Desfecho ser preenchido.
- [x] Salvamento do Desfecho desbloqueia os blocos e persiste os dados na tabela `sermons` do Cloudflare D1 via Worker.
- [x] Após o desbloqueio inicial, o pregador pode editar livremente qualquer bloco ou alterar o Desfecho sem perder conteúdo digitado.
- [x] Testes de integração validando o comportamento de bloqueio/desbloqueio progressivo e persistência no D1.

---

## Ticket 3: Trava Anti-Esegese e Bloco 1 (Explicar o Texto) ([#28](https://github.com/bmalossi/biblia-vive/issues/28))

**What to build:** O pregador desenvolve o Bloco 1 (Explicar o Texto — Exegese & Contexto Histórico). Para avançar para os tópicos do sermão, a interface impõe a Trava Anti-Esegese: o Bloco 2 permanece bloqueado até o preenchimento da Pergunta Reflexiva Obrigatória ('Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?'). O texto digitado é salvo no Cloudflare D1 e automaticamente injetado como cabeçalho de ancoragem do Bloco 1 no esboço, liberando o Bloco 2.

**Blocked by:** [#27](https://github.com/bmalossi/biblia-vive/issues/27)

- [x] Interface do Bloco 1 com campos de contexto histórico, propósito da perícope bíblica e detalhes exegéticos.
- [x] Trava Anti-Esegese implementada como campo reflexivo compulsório ao final do Bloco 1, exigindo pelo menos 1 frase com a intenção do autor bíblico original.
- [x] Bloco 2 permanece bloqueado enquanto a pergunta de intenção original não estiver respondida.
- [x] Resposta da intenção original é exibida como cabeçalho contextual de ancoragem do Bloco 1 no esboço final.
- [x] Estado do Bloco 1 e a resposta da trava persistem no Cloudflare D1 via Worker.
- [x] Testes de integração cobrindo a validação do campo reflexivo, desbloqueio do Bloco 2 e persistência.

---

## Ticket 4: Bloco 2 com Guardrails de Tópicos (1 a 4) e os 4 Degraus (A, B, C, D) ([#29](https://github.com/bmalossi/biblia-vive/issues/29))

**What to build:** O pregador desenvolve o Bloco 2 (Pregar a Inspiração — Exposição & Tema Central). O bloco nasce por padrão com 3 Tópicos Homiléticos. O pregador pode excluir tópicos até o mínimo de 1 ou adicionar até o máximo de 4 (guardrail para evitar dispersão). Cada tópico ativo herda compulsoriamente os 4 Degraus de Desenvolvimento (Degrau A: Fato, Degrau B: Porquê, Degrau C: Contraste, Degrau D: Tensão/Gancho). A conclusão deste bloco libera o Bloco 3 (Aplicar à Vida Real) e o Gancho de Entrada da Introdução, com persistência contínua no Cloudflare D1.

**Blocked by:** [#28](https://github.com/bmalossi/biblia-vive/issues/28)

- [ ] Bloco 2 inicializa com 3 Tópicos Homiléticos por padrão.
- [ ] Ações de remoção respeitam o limite mínimo de 1 tópico ativo.
- [ ] Ação de adicionar tópico (`[ + Adicionar Tópico ]`) respeita o teto máximo inegociável de 4 tópicos ativos.
- [ ] Cada tópico ativo renderiza obrigatoriamente os 4 campos de Degraus (A: Fato, B: Porquê, C: Contraste, D: Tensão/Gancho).
- [ ] Conclusão do Bloco 2 desbloqueia o Bloco 3 (Aplicação Prática) e a Introdução (Gancho de Entrada).
- [ ] Todos os tópicos, degraus, aplicação e introdução persistem no Cloudflare D1.
- [ ] Testes de integração validando os limites de tópicos (1 a 4), campos obrigatórios dos degraus e persistência.

---

## Ticket 5: Painel do Estúdio (`/estudio`) e Gate de Acesso Templo ([#30](https://github.com/bmalossi/biblia-vive/issues/30))

**What to build:** Criação da rota `/estudio` com o Painel do Estúdio Homilético. Para Pregadores (usuários com plano Templo ativo), a página lista os sermões cadastrados (rascunhos e prontos) com busca por texto ou passagem bíblica, estatísticas de pregações e botão para iniciar novo estudo homilético. Para Visitantes e Leitores Gratuitos/Pro, a rota exibe uma apresentação solene do módulo com botão de upgrade/contato para o plano Templo. Adiciona o atalho 'Estúdio Homilético' no menu principal para usuários elegíveis.

**Blocked by:** [#26](https://github.com/bmalossi/biblia-vive/issues/26)

- [ ] Rota `/estudio` criada e protegida por verificação de permissão do plano Templo.
- [ ] Endpoint do Cloudflare Worker para listagem paginada de sermões do usuário autenticado no D1.
- [ ] Interface do Painel listando sermões com título, passagem bíblica, status (rascunho/pronto), data de criação e histórico de ministração.
- [ ] Filtro de busca na listagem por termo do título ou referência bíblica.
- [ ] Gate institucional exibido para usuários sem plano Templo (Gratuito/Pro/Visitante) explicando os recursos do Estúdio e convidando ao upgrade.
- [ ] Item 'Estúdio Homilético' visível no menu de navegação da aplicação para usuários Templo.
- [ ] Testes de rotas, controle de acesso e renderização de listagem.

---

## Ticket 6: Modo Púlpito Solene com Screen Wake Lock e Versículos Interativos ([#31](https://github.com/bmalossi/biblia-vive/issues/31))

**What to build:** O pregador clica em `[ 📖 Pregar Agora ]` no Estúdio e entra na rota `/pulpito/[sermonId]`. A interface oculta cabeçalhos, rodapés e distrações do site, aciona a Screen Wake Lock API para impedir que a tela do tablet ou smartphone apague durante o culto, exibe tipografia serifada nobre com alto contraste legível a um braço de distância, cronômetro discreto no topo, barra de mapa com pílulas para navegação por smooth scroll, marcadores de tom de voz/dinâmica (`[Ilustração]`, `[Pausa]`, `[Tom/Apelo]`) e pílulas de passagens bíblicas que abrem o texto sagrado em um card flutuante sem perder a posição da pregação.

**Blocked by:** [#29](https://github.com/bmalossi/biblia-vive/issues/29)

- [ ] Rota `/pulpito/[sermonId]` criada com interface imersiva e zero distrações.
- [ ] Screen Wake Lock API acionada na montagem do componente com liberação graciosa no unmount ou saída.
- [ ] Cronômetro discreto no topo superior exibindo tempo decorrido de pregação.
- [ ] Mapa do sermão em pílulas no cabeçalho com salto suave por scroll para cada seção.
- [ ] Estilização visual para marcadores de dinâmica (`[Ilustração]`, `[Pausa Silenciosa]`, `[Tom de Voz / Apelo]`).
- [ ] Pílulas de referências bíblicas que expandem o texto canônico completo em card flutuante mantendo o scroll do sermão.
- [ ] Testes de integração validando ativação da Wake Lock API, interação com pílulas e navegação.

---

## Ticket 7: Registro Pós-Pregação no D1 e Prevenção de Repetição ([#32](https://github.com/bmalossi/biblia-vive/issues/32))

**What to build:** Ao clicar em `[ ⏹️ Encerrar Pregação ]` no Modo Púlpito, uma janela solene solicita os dados da ministração: Nome da Igreja/Comunidade, Cidade, Data e Resumo do Impacto Espiritual, além de um checkbox opcional para espelhar o resumo no Memorial como Testemunho. Os dados são salvos na tabela `preaching_logs` no Cloudflare D1. O Estúdio Homilético passa a consultar esses registros e exibe um alerta preventivo caso o pregador abra para preparação uma mensagem já ministrada anteriormente naquela mesma comunidade.

**Blocked by:** [#31](https://github.com/bmalossi/biblia-vive/issues/31)

- [ ] Tabela `preaching_logs` criada no Cloudflare D1 vinculada a `sermon_id` e `user_id`.
- [ ] Modal de encerramento de pregação solicitando comunidade, cidade, data e notas espirituais.
- [ ] Checkbox opcional para criar automaticamente um Registro do Memorial (categoria Testemunho) no Supabase.
- [ ] Endpoint do Worker para salvar e listar históricos de pregação de um sermão no D1.
- [ ] Indicador preventivo no Estúdio Homilético alertando caso a mensagem já tenha sido pregada na mesma comunidade.
- [ ] Testes cobrindo persistência em `preaching_logs`, alerta de duplicidade e fluxo de encerramento.

---

## Ticket 8: Guardião do Evangelho (Gálatas 1:8) e Teste de Ortodoxia via JEV ([#33](https://github.com/bmalossi/biblia-vive/issues/33))

**What to build:** Implementação da infraestrutura de auditoria teológica com o modelo JEV (TypeSafe AI). Envia o payload homilético estrito (texto bíblico, faísca inicial, desfecho da marcha-ré, exegese, tópicos com degraus A-D e aplicação), rigorosamente desvinculado das 30 notas do Memorial. Acionado sob demanda via botão `[ 🏛️ Testar Ortodoxia ]` ou ao clicar em `[ 📖 Pregar Agora ]`. Utiliza as primitivas `Noul` (`is_grace_centered`) e `Choice` (`theological_deviation`). Se a confiança de desvio doutrinário for $\ge 0.85$, a UI exibe o Alerta de Fidelidade Doutrinária (Gálatas 1:8) direcionado à consciência pastoral, permitindo ajuste voluntário ou prosseguimento consciente. Integra consulta RAG a comentários históricos no teste de ortodoxia.

**Blocked by:** [#29](https://github.com/bmalossi/biblia-vive/issues/29)

- [ ] Serviço `jevHomileticService` construído com suporte às primitivas `Noul`, `Choice` e validação de payload estrito (sem as notas do Memorial).
- [ ] Endpoint de borda ou Vercel function autenticada executando a chamada segura à API JEV com chave protegida.
- [ ] Botão `[ 🏛️ Testar Ortodoxia ]` no Estúdio Homilético que recupera alinhamento histórico via RAG e avaliação JEV.
- [ ] Checagem automática disparada ao clicar em `[ 📖 Pregar Agora ]`.
- [ ] Card solene de Alerta de Fidelidade Doutrinária baseado em Gálatas 1:8 exibido quando confiança de desvio $\ge 0.85$, com opções pastorais reflexivas (sem bloqueio compulsório autoritário).
- [ ] Testes de integração validando construção do payload, parsing das respostas JEV e renderização do alerta doutrinário.
