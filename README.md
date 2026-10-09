# ActionDeck

Paste a meeting transcript and get a verifiable list of commitments. Each task carries its exact source sentence; a second model pass checks both that the quote appears verbatim and that it supports the task. Owners and deadlines are never guessed.

## Run locally

1. Use Node.js 20 or newer.
2. Copy `.env.example` to `.env.local`.
3. Set `LLM_PROVIDER` to `gemini` or `groq` and set `LLM_API_KEY` to a key from that provider.
4. Optionally set `NEATLOGS_API_KEY` to send metadata-only traces to Neatlogs.
5. Run `npm install` and `npm run dev`, then open http://localhost:3000.

Gemini uses Google's OpenAI-compatible endpoint with `gemini-2.5-flash`; Groq uses `openai/gpt-oss-120b`. ActionDeck makes no database writes and does not persist submitted transcripts. The transcript is sent to the selected LLM provider for processing.

### Trace payloads

Neatlogs traces include operation names, durations, statuses, token counts, transcript character counts, and sanitized error evidence. Transcript content and model output are excluded by default. `NEATLOGS_LOG_PAYLOADS=true` enables payload capture only when running locally in development and only for a byte-for-byte built-in synthetic sample; production always disables it.

## Checks

- `npm test` runs focused extraction contract tests.
- `npm run typecheck` checks TypeScript.
- `npm run build` builds the production app.

## Privacy and scope

No accounts, meeting bot, audio capture, database, or result persistence. Built-in samples are synthetic. Do not use private transcripts unless you have permission to share them with the configured LLM provider.
