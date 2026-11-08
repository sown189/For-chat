# Finessers beta release gate

Finessers is a **local, single-user prototype**, not a publicly deployable multi-user product. The API intentionally refuses to start with `NODE_ENV=production` unless explicitly overridden for controlled testing. Do not use the override to publish the server.

## Verify locally

1. Pull the latest branch and run `npm install`.
2. Set `CANVAS_BASE_URL` and `CANVAS_ACCESS_TOKEN` **only in your own local environment**, never in a chat, issue, frontend file, or screenshot.
3. Start Ollama or connect a model through the local app.
4. Run `npm run doctor`. This checks the real Canvas profile API, local Playwright Chromium, and AI server availability. It does **not** prove an entire academic task succeeds.
5. Run `npm test && npm run build`.
6. Run `npm run start:all`, open the Canvas workspace, and click **VERIFY LIVE CANVAS CONNECTION**.
7. On a test course, run the academic agent, verify its assignment references against Canvas, approve read-only browser observation, and inspect whether browser navigation reaches the authenticated assignment rather than a login page. The current browser does not automatically inherit Canvas API credentials.
8. Test declined approval, model outage, expired Canvas token, Canvas pagination, inaccessible assignment and wrong-page redirects.

## Required before public beta

- [ ] User authentication, per-user Canvas OAuth (no shared server-wide token), and tenant isolation
- [ ] Durable encrypted storage, credential rotation, deletion, privacy policy, retention limits
- [ ] Persistent authenticated browser workers with isolation, timeouts, resource quotas and action approvals
- [ ] Server-side authorization on every session/action, rate limiting and abuse protection
- [ ] Production origin policy, deployment secrets, monitoring, incident handling and backups
- [ ] Real-account end-to-end Canvas tests with explicit student consent
- [ ] Accessible UI and cross-browser/mobile acceptance tests
- [ ] Reliable deployment and rollback plan

Passing mock API and GitHub CI tests **does not** satisfy these gates.

## Supervised computer-use v3 local verification

This branch migrates OpenAI computer use from the retired preview model to the current `computer` tool (`gpt-6.1-sol`). The agent handles model-requested action batches **one approval at a time** and returns one screenshot after the approved batch. It can start on a user-specified public URL, display the current page and action timeline, retry a recoverable model-call error, and pause at login/CAPTCHA challenges. Search Enter is permitted only in recognized GET search fields; destructive clicks and non-GET requests are blocked during AI control.

### Manual Canvas browser sign-in (Mac desktop only)

1. On your own computer, configure `CANVAS_BASE_URL` to your Canvas HTTPS origin, install Playwright Chromium, and start `npm run start:all`.
2. Open **Browser → Supervised Computer-Use Agent**. Enter a starting URL on **that exact Canvas origin** and a read-only task.
3. Select **LET ME SIGN IN TO CANVAS FIRST**. This explicitly opens a **visible local Chromium window** with network requests under human control. Do not put passwords into the Finessers task or AI chat.
4. Log in **yourself** in that window, including any school SSO, until you return to a Canvas page. The local API does not capture the sign-in screen or send it to a model during this phase.
5. Click **RESUME SUPERVISED AI**. The code verifies that the browser is back on the configured Canvas origin and has no visible password-input barrier. The window is switched back to read-only network enforcement, and the selected model receives page screenshots. For the OpenAI mode, these screenshots are sent to OpenAI; use it only with informed consent.
6. Review **each** proposed action in the app and approve or decline. A stopped session closes the isolated browser; the login profile is not persisted. Test with a non-sensitive course first.

The visible login mode requires a graphical desktop and may not work with every school SSO, MFA, pop-up, or anti-bot system. Browser cookies do not transfer into Canvas API auth or vice versa. No real FAU account login has been performed in CI. Unit tests and mocked browser E2E cannot establish live Canvas compatibility.

### Acceptance tests

Run `npm test && npm run build`, then start the backend and run `npm run test:e2e`. Separately verify on a real account: read-only navigations, no automatic assignment submission, manual login privacy, safe search, refusal of logout/delete links, interrupted network recovery, and operator stop behavior. Require a production security review before deployment.
