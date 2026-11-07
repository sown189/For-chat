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
