# Bible Vive - Agent Guide

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one CONTEXT.md + docs/adr/ at repo root. See `docs/agents/domain.md`.

### Speech-to-Text (AssemblyAI)

Serverless STT proxy in `/api/stt.ts` using AssemblyAI API (`universal-2`, `language_code: "pt"`). Never expose `ASSEMBLYAI_API_KEY` to client code.