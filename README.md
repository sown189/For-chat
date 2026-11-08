# Finessers AI — local beta

**Don't stress it. Finesse it.**

Finessers is a student study workspace with a React/Vite frontend and a local Node API. This branch contains Canvas read-only integrations, AI tutoring, browser operator tools, and approval-gated computer-use workflows. **Not yet ready for public deployment.**

## Run on your Mac

Requires Node.js and npm.

```bash
cd ~/For-chat
git fetch origin
git switch round-29-five-priority-beta-workflows
git pull --ff-only
npm install
npx playwright install chromium
npm run start:all
```

Open the local URL printed in the terminal.

## AI setup

ChatGPT Plus does not include OpenAI API credits. Create a separate key at https://platform.openai.com/api-keys and configure API billing. In Finessers AI settings, choose OpenAI and enter the key. The local API validates the key and holds it in server memory; restarting requires reconnecting. Never commit keys to GitHub or put them in client-side code.

Alternatively, choose Ollama for local study chat. Local computer-use requires a vision-capable model (default: `qwen2.5vl:7b`). Model capabilities vary.

## Canvas

Canvas requires an institution base URL and either configured OAuth credentials or a locally configured access token. Keep credentials in the local environment. OAuth availability depends on institution approval. The student must handle their own login.

## Verify

```bash
npm test
npm run build
npm run doctor
npm run test:e2e
```

Some checks require a running app, Chromium, Canvas credentials, or an AI model. Review actual results before claiming successful integration.

## Current limitations

- Computer use is approval-gated and read-only. It cannot autonomously submit assignments, purchase items, or change account settings.
- The API binds to loopback and is not designed for multi-user hosting.
- Public launch requires authentication, user isolation, persistence, rate limits, cost controls, and a security review.
- Model availability and computer-use support depend on API access and billing.
- Course Intelligence and onboarding need real-user validation before release.

## Scripts

- `npm run dev` — frontend
- `npm run api` — local API
- `npm run start:all` — frontend and API
- `npm run doctor` — environment checks
- `npm run test:canvas-live` — live Canvas smoke test, requires credentials

This README describes the current local beta, not the original frontend-only prototype.
