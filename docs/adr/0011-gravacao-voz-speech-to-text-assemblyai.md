# 11. Gravação Rápida por Voz para o Memorial (Speech-to-Text via AssemblyAI)

* Status: Aceito
* Data: 2026-08-28

## Contexto e Problema

O Leitor ou Visitante frequentemente necessita registrar uma reflexão, oração ou testemunho no exato momento da inspiração ou da circunstância (ex.: enquanto dirige, caminha ou realiza tarefas que o impeçam de digitar).
A interface precisava disponibilizar uma ferramenta de captura imediata de áudio, com **zero fricção**, posicionada logo no topo da página inicial (`HomePage`), acima da grade de livros bíblicos, transcrevendo a voz e salvando automaticamente o registro no **Memorial**.

## Decisões de Arquitetura

1. **Provedor e Modelo de Speech-to-Text (AssemblyAI):**
   - Utilização da API da **AssemblyAI** em modo pré-gravado (`pre-recorded`), via upload direto de áudio WebM gravado pelo navegador.
   - Adoção do modelo **`universal-2`** (`speech_models: ["universal-2"]`) para o MVP, garantindo a opção de melhor custo-benefício.
   - Parâmetros configurados para pontuação automática (`punctuate: true`), formatação de texto (`format_text: true`) e idioma português (`language_code: "pt"`).

2. **Segurança de Credenciais e Proxy Serverless Assíncrono (`/api/stt.ts`):**
   - A chave de API (`ASSEMBLYAI_API_KEY`) reside estritamente no ambiente do servidor (`.env`, `.env.local` e Vercel Environment Variables).
   - Nenhuma chave é exposta ao código cliente ou ao repositório público.
   - Para contornar o limite de tempo de execução estrito de 10s das Serverless Functions no plano Hobby da Vercel (evitando erros 504 Gateway Timeout), a rota adota padrão assíncrono:
     - `POST /api/stt`: Recebe o áudio binário, faz upload na AssemblyAI, submete o job e retorna imediatamente `{ id, status: "queued" }` em menos de 2 segundos.
     - `GET /api/stt?id=<id>`: Realiza a consulta rápida de status e texto pronto (`completed`), respondendo em ~200ms a cada ciclo de polling disparado pelo navegador.
   - No ambiente local de desenvolvimento, o middleware no `vite.config.ts` (`apiDevServerPlugin`) intercepta e executa as rotas `/api/*` carregando as variáveis de ambiente locais.

3. **Permissões de Hardware e Ciclo de Vida do Microfone:**
   - Atualização do cabeçalho `Permissions-Policy` no `vercel.json` para `microphone=(self)`.
   - Implementação da rotina `cleanupAudioStream` que desativa imediatamente as faixas de áudio (`track.enabled = false`), encerra o hardware (`track.stop()`) e libera referências na memória assim que a gravação é concluída ou cancelada, garantindo privacidade estrita e sem retenção do microfone pelo navegador.

4. **Design Nativo Editorial e Sem Poluição Visual (`QuickVoiceMemorial.tsx`):**
   - Integração nativa na página inicial sem cards ou molduras artificiais, seguindo a tipografia e hierarquia das seções de livros (`GRAVAÇÃO POR VOZ`).
   - Dica descritiva condensada em um ícone circular simétrico de exclamação `!`, acessível via tooltip.
   - Alinhamento responsivo: no Desktop os botões ficam centralizados na largura da página na mesma linha do título; no Mobile os botões ficam centralizados harmonicamente abaixo do título.

5. **Mapeamento Semântico para o Memorial:**
   - O texto transcrito é salvo automaticamente na `NoteStore` (`SupabaseNoteStore` para Leitores autenticados ou `LocalNoteStore` para Visitantes).
   - O conteúdo falado é mapeado estruturadamente de acordo com a categoria selecionada:
     - **Reflexão**: Preenche `metadata.soap.observation` (método SOAP).
     - **Oração**: Preenche `metadata.motivo`.
     - **Testemunho**: Preenche `metadata.oQueAconteceu`.
     - **Propósito**: Preenche `metadata.objetivo`.
   - O `MemorialEntryModal` conta com fallback automático para preencher os campos de edição mesmo em registros prévios sem metadata preenchida.

## Consequências

- Entrada de dados por voz rápida, acessível e sem atrito para os usuários da plataforma.
- Estrutura de dados 100% compatível com a evolução do Memorial (ADR-0008).
- Infraestrutura segura e econômica pronta para escalar para outros modelos (como `universal-3-5-pro`) quando necessário.
