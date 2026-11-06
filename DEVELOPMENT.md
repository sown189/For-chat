# Finessers development status

## Start locally
```bash
git pull
npm install
npx playwright install chromium
npm run start:all
```
Visit http://localhost:5173/For-chat/ and select Workspace → AI Operator.

## System check
The **CHECK SYSTEM** button in AI Operator calls `/api/agent/diagnostics`. If it says the route is missing or returns a 404, you are running an old backend. Stop the process on port 8787, then restart `npm run start:all`.

## OpenAI computer use
Connect a key in the AI Operator panel. Computer use operates a **separate headless browser**, not the user's Mac. It uses the OpenAI Responses computer-use-preview integration and requires the corresponding API model access. Each action requires approval in this prototype. This integration has **not** been verified against a live account. Do not use it for sensitive accounts or transactions yet.

## Local AI chat (no paid API)
Install Ollama, then run:
```bash
ollama pull qwen3:4b
ollama serve
```
If Ollama is already running, do not start another server. Open Workspace → AI Assistant → AI Settings and select **LOCAL OLLAMA (FREE)**. The local model is currently for chat and planning only; it does **not** yet control the browser. You can change the model with `OLLAMA_MODEL` and server with `OLLAMA_BASE_URL`.

## Still needed before public launch
- Validate the OpenAI computer-use model, tool schema, screenshot and safety-check loop end to end.
- Replace per-click approvals with policy-based approvals, retaining confirmations for consequential actions.
- Harden browser isolation against SSRF, DNS rebinding, prompt injection and malicious pages.
- Add authenticated user accounts and per-user sessions; current server memory and key are **single-user local prototype only**.
- Add durable task storage, resumable sessions and cleanup for abandoned browser processes.
- Implement and benchmark local vision computer use; Ollama chat alone is not a computer-use agent.
- Add automated tests, deployment, monitoring and operational cost controls.

Do not expose this prototype server publicly.
