# Documento de Handoff — Bíblia Vive (Diretoria Editorial)

**Data:** 23 de Julho de 2026  
**Projeto:** Bíblia Vive (`bmalossi/biblia-vive`)  
**Contexto:** Criação, refinamento e padronização da estratégia editorial e de imagem para redes sociais.

---

## 1. Resumo do Trabalho Realizado

Durante a sessão, atuamos como Diretor Editorial da Bíblia Vive e consolidamos a estratégia de conteúdo público da marca para redes sociais:

1. **Definição e Refinamento do Arco Narrativo de 18 Capítulos (3 Séries):**
   - **Série 1 — *Permanecer* (Cap. 1 a 6):** Da desaceleração à perseverança constante.
   - **Série 2 — *Cultivo* (Cap. 7 a 12):** O amadurecimento, criação de raízes e prática no cotidiano.
   - **Série 3 — *Discernimento* (Cap. 13 a 18):** Transformação do olhar e encerramento com retorno cíclico ao Salmo 1.

2. **Formalização de Decisões Arquiteturais e Editoriais:**
   - **BDR-0014 (`BDR-0014.md`):** Decisão arquitetural declarando que o conteúdo é estruturado em *Ciclos Narrativos de Permanência*, sem "linhas de chegada" ou "fases concluídas", onde o encerramento convida ao retorno (ex.: Salmo 1).
   - **Regra Editorial 12 (Princípio da Centralidade da Palavra):** A Bíblia Vive desaparece diante das Escrituras. A legenda prepara e abre espaço no dia; o texto bíblico completa a mensagem. Fim dos formatos devocionais moralistas/explicativos. Legendas ~30-40% mais enxutas.
   - **Regra Editorial 13 (Princípio da Companhia na Caminhada):** As séries não "ensinam assuntos", mas acompanham o Leitor na sua caminhada.
   - **Pontes Cinematográficas:** Conexões fluidas entre os encerramentos e aberturas de cada série (Cap. 6 `Continue` → Cap. 7 `Quem continua... começa a cultivar` → Cap. 12 `Cultivar é continuar` → Cap. 13 `O que foi cultivado no silêncio... começa a transformar o olhar`).

3. **Criação da Skill e Modelos de Imagens Permanentes:**
   - **Skill `bible-visual-creator` (`C:\Users\sorai\.gemini\config\skills\bible-visual-creator\SKILL.md`):** Criada e refatorada com base nos princípios de `writing-great-skills` (autenticidade documental, iluminação natural, espaço negativo de 50-70% para texto).
   - **Modelos Visuais Permanentes (BV-01 a BV-06):** Atualizado o `IMAGERY.md` com a especificação técnica, enquadramento, zona de texto e prompts em inglês para IA de cada um dos 6 cenários oficiais.

4. **Sincronização no Trello:**
   - Quadro **Bíblia Vive - Editorial** (`https://trello.com/b/w0M2gFvA`) 100% estruturado e populado com os 18 cartões contendo lâminas/imagem, legendas minimalistas, sugestões visuais BV e links de serviço (`bibliavive.com.br`).

---

## 2. Documentos Alterados / Criados

- `docs/branding/content/EDITORIAL.md` — Atualizado com a Regra 12 (Centralidade da Palavra), Regra 13 (Companhia na Caminhada) e referência ao BDR-0014.
- `docs/branding/design/IMAGERY.md` — Atualizado com as especificações técnicas dos modelos BV-01 a BV-06 e a Matriz de Seleção de Modelo Visual.
- `docs/branding/governance/bdr/BDR-0014.md` — Criado BDR-0014 oficializando os Ciclos Narrativos de Permanência.
- `C:\Users\sorai\.gemini\config\skills\bible-visual-creator\SKILL.md` — Skill para criação e avaliação de prompts de imagens bíblicas sutis e profundas.
- Artefato Principal: `publicacoes_inaugurais_biblia_vive.md` (localizado no diretório da conversa / artefatos do sistema) contendo o planejamento máster detalhado dos 18 capítulos.

---

## 3. Próximos Passos Sugeridos

- Acompanhar a produção visual dos criativos das listas **Preparar Criativo** e **Pronto para Publicar** no Trello.
- Iniciar a produção das próximas séries editoriais (Série 4 em diante) mantendo a cadência das Regras 12 e 13 e BDR-0014.

---

## 4. Suggested Skills para o Próximo Agente

- `bible-visual-creator`: Utilizar para gerar ou avaliar prompts de imagens e especificações visuais de posts.
- `social-post-writer-seo`: Utilizar ao redigir novos conteúdos mantendo os princípios de concisão e clareza.
