# 11. Gravação Rápida por Voz para o Memorial (Arquitetura Híbrida: Cloudflare R2 + AssemblyAI com Fallback Web Speech)

* Status: Aceito e Atualizado
* Data: 2026-09-10 (Atualização da arquitetura para alta fidelidade e resolução de timeouts)

## Contexto e Problema

O Leitor ou Visitante frequentemente necessita registrar uma reflexão, oração ou testemunho no exato momento da inspiração ou da circunstância (ex.: enquanto dirige, caminha ou realiza tarefas que o impeçam de digitar).
A Web Speech API nativa do navegador apresentava sérias limitações:
1. **Falta de pontuação e contexto:** Cortes frequentes em pausas de respiração (`no-speech`) e vocabulário bíblico impreciso.
2. **Duplicação de palavras:** O loop de eventos acumulava texto incrementalmente com base em `event.resultIndex`, gerando palavras duplicadas durante re-emissão de índices pelo Chrome.
3. **Gargalo anterior na Vercel:** O upload direto de áudio binário para a Vercel Serverless causava timeouts de 60s (`504 FUNCTION_INVOCATION_TIMEOUT`) devido à assinatura de função incompatível e limites de payload.

## Decisões de Arquitetura

1. **Upload Direto para Cloudflare R2 (Borda Global):**
   - Criação do endpoint `/api/voice-upload-url` que gera URLs pré-assinadas PUT via AWS Signature V4 puramente em Node.js (`crypto`).
   - O áudio binário (WebM/Opus capturado em 48kHz com cancelamento de ruído/eco) é enviado **diretamente do navegador para o Cloudflare R2** (`midia.bibliavive.com.br`).
   - **Zero tráfego pesado de áudio na Vercel** — elimina 100% o risco de erro 504 na Vercel.
   - **Zero custo de transferência (egress):** A AssemblyAI baixa o áudio dos servidores da Cloudflare sem custo de saída.

2. **Transcrição Primária via AssemblyAI (`universal-2` em pt-BR):**
   - A rota `/api/stt` recebe apenas o JSON leve `{ audioUrl }` e submete o job para a AssemblyAI com pontuação e formatação automáticas.
   - Polling assíncrono via `GET /api/stt?id=...` a cada ~900ms com timeout estrito de 7 segundos.

3. **Fallback Automático e Transparente (Web Speech API Determinística):**
   - Enquanto o usuário fala, o motor `speechRecognitionEngine.ts` executa em paralelo reconstruindo `event.results[0..length-1]` de forma imutável (eliminando 100% da duplicação de palavras).
   - O preview na tela é exibido ao vivo em tempo real.
   - Se a AssemblyAI demorar mais de 6-7s, falhar ou o dispositivo estiver sem conexão estável, o sistema adota automaticamente o texto capturado pelo Web Speech, garantindo que o leitor **nunca perca seu registro**.

4. **Permissões de Hardware e Ciclo de Vida do Microfone:**
   - Permissão garantida pelo utilitário `ensureMicrophonePermission.ts`.
   - Limpeza estrita de tracks de áudio ao parar ou cancelar (`cleanupAudioStream`).

5. **Mapeamento Semântico para o Memorial e Caderno de Estudos:**
   - O texto transcrito é salvo automaticamente na `NoteStore` (`SupabaseNoteStore` para Leitores autenticados ou `LocalNoteStore` para Visitantes).
   - O componente reutilizável `VoiceRecordButton.tsx` aplica a mesma arquitetura de alta fidelidade ao Caderno de Estudos de cada capítulo e aos campos SOAP do Memorial.

## Consequências

- Máxima qualidade de transcrição com pontuação impecável da AssemblyAI.
- Resiliência total com fallback instantâneo no cliente.
- Zero duplicações de palavras no Web Speech.
- Egress gratuito e escala ilimitada via Cloudflare R2.
