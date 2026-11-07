# Finessers platform roadmap and implementation status

## Implemented in this branch
- Persistent **local** mission board: create, start, complete, delete tasks. Stored in browser localStorage. No scheduled/background agent execution.
- Offline study cards and quiz prompts generated from pasted notes or term-definition lines. This is deterministic parsing, **not** AI-generated summaries or validated quizzes.
- Browser tab organizer with URL validation and links to open sites in the user's browser. This is **not** embedded authenticated multi-tab browsing.
- Chrome Manifest V3 companion extension scaffold with a user-triggered active-tab title/URL inspector and local workspace shortcut. Load unpacked from extension/. It does **not** automate websites or transmit tab data.
- Existing Canvas API deadline and course tools remain available, subject to valid local credentials.

## Still required before public beta
1. Multi-user auth: select a vetted authentication provider; implement login/logout, server-side sessions, CSRF, account recovery, per-user authorization, database isolation and deletion.
2. Authenticated Canvas navigation: secure OAuth flow with scoped permissions; avoid storing passwords; build login handoff and real-account browser tests. Canvas API access tokens do not authenticate the Playwright browser.
3. AI study generation: source-grounded prompts, model routing, citations, content quality tests, and per-user quotas.
4. Persistent agent missions: durable database state, resumable workflows, audit trails, idempotent steps, explicit consent and scheduled worker infrastructure.
5. Browser extension: user consent, secure backend handshake, permissions review, browser-store policy compliance and extension security audit.
6. End-to-end tests on a consenting real Canvas account; production observability and hosting.

## Security
Do not expose the local backend publicly. This branch does not implement production authentication or a secure multi-tenant boundary. Local browser storage is not encrypted or synced.
