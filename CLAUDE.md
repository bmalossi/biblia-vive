# Bible Vive - Agent Guide

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one CONTEXT.md + docs/adr/ at repo root. See `docs/agents/domain.md`.

### Speech-to-Text

Client-side native Web Speech API (`SpeechRecognition` pt-BR) in `src/components/QuickVoiceMemorial.tsx` for real-time zero-latency transcription. Serverless STT proxy in `/api/stt.ts` kept as fallback infrastructure. Never expose private API keys to client code.