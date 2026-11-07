# Finessers feature test audit (Round 27)

## Automated Chromium E2E (real frontend + backend)
- Local backend health and deployment guard
- Cross-origin and non-JSON API mutation rejection
- Landing page → browser workspace
- Browser tabs, website URL validation
- Unified AI sidebar, opt-in tab metadata, mocked AI response
- Study generator: term-definition parsing, card reveal
- Missions: create, complete, delete
- Canvas disconnected state
- Canvas courses → assignments and modules → module pages (mocked Canvas responses)

## Additional Node tests
Run `npm test` for Canvas OAuth PKCE, token refresh races, Canvas API transport, navigation, credential isolation, agent boundaries and other backend checks.

## Still unverified; do not claim full coverage
- FAU Canvas OAuth and SSO/MFA on a real student account
- Live Canvas API reads with institution authorization (`npm run test:canvas-live`)
- Authenticated Playwright browser session (not yet implemented)
- Real Ollama and OpenAI model calls and end-to-end agent action approvals
- Mobile Safari, Firefox, Windows, performance, accessibility and multi-user security
- Persistent user accounts, credential encryption, public deployment and recovery
- Browser visual correctness beyond smoke assertions

## How to run
1. `npm install`
2. `npx playwright install chromium`
3. In one terminal, `npm run start:all`
4. In another terminal, `npm run test:e2e`

CI also runs these checks automatically. These tests use mocked external services to avoid exposing credentials or incurring model charges.
