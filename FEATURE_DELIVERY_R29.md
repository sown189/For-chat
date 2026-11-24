# Finessers Round 29 — Five priority beta workflows

**Scope:** Local, single-user development beta. This branch is not a hosted, account-based product.

## What was built

1. **Supervised AI browser navigation.** The browser sidebar can prefill a task with the current website's URL and expand the computer-use panel. The existing OpenAI or Ollama vision computer-use engine proposes actions based on screenshots, and every action requires explicit student approval. A visible action timeline, proposed action JSON, safety-check hints, and starter tasks are available. The agent runs in an **isolated read-only session**; it does not inherit Chrome/Canvas login cookies and form submissions are blocked.
2. **Automatic Canvas assignment radar.** On opening Browser, Finessers calls the existing server-side Canvas mission endpoint. It shows up to five next assignments, due dates, priority, partial-sync status, links to verify in Canvas, and a one-click assignment-study handoff. Failed/disconnected Canvas is reported, not faked.
3. **Page-aware copilot with consent.** Canvas assignment and page details, plus observed text from the isolated browser preview, may be placed in **browser memory**. Two separate opt-in switches control sharing tab metadata or current-page text with a model. Page-text opt-in resets when pages change, and each request includes no more than 3,500 characters of reference text. Untrusted webpage content is labeled as data; backend system prompt explicitly treats it as untrusted.
4. **One-click local study flow.** The 'STUDY THIS PAGE' button and Canvas deadline cards populate the Study Generator automatically. It generates local term/definition flashcards, practice recall cards, a source-derived review outline, a seven-day practice template, and copy-to-clipboard export. These are deterministic study aids, **not model-generated summaries**. Students must verify source accuracy.
5. **Private beta preparation.** New 'Beta Setup' checks backend, Canvas and AI status and explicitly marks public authentication and production readiness as blockers. The development frontend binds to loopback, Canvas bearer-token requests require HTTPS outside loopback, isolated Playwright browsers preflight DNS to reject private-network targets. Production server startup remains blocked without an explicit local beta override.

## Testing

- Node unit tests in `tests/` plus added DNS/Canvas TLS regressions.
- Chromium E2E tests in `scripts/e2e-smoke.mjs` cover page-sharing default and opt-in, browser-to-agent prefill, Canvas assignment study handoff, beta checklist, action approval timeline, mobile navigation, plus existing features.
- CI: `npm test`, `npm run build`, `npm run test:e2e`. See PR checks for the latest verified status.

## Still required before a public launch

- **Real user login**, secure invite and session flows, database account isolation, encryption/key management and secrets lifecycle.
- Real FAU Canvas OAuth/SSO/MFA testing with consent and permitted Canvas scopes.
- Live OpenAI/Ollama computer-use test runs with real web pages, plus an explicit takeover/login procedure for authenticated sites.
- Browser security review and network-level sandboxing; DNS preflight is only defense in depth, not complete DNS pinning.
- Accessibility, device coverage, load limits, error recovery, privacy policy and consent practices, monitoring and deployment.

**Do not treat green mocked UI tests as evidence that public authentication, FAU Canvas login or real autonomous assignment interactions have passed.**
