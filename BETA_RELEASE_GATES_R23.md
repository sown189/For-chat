# Finessers beta release gates — Round 23

## Implemented and covered by automated tests
- Canvas OAuth authorization-code PKCE, one-time state validation, refresh serialization and disconnect protection.
- Canvas credential precedence: when OAuth is configured, disconnect cannot silently expose another account's legacy environment-token data.
- Read-only Canvas API course and assignment navigation.
- Isolated Playwright browser sessions with screenshots, read-only link navigation, address navigation, scrolling, and explicit stop.
- Local development deployment guard.

## Not yet verified / not ready for public deployment
- Real FAU Canvas OAuth developer-key handshake and university login, including SSO/MFA.
- Authenticated Playwright Canvas website sessions: Canvas API tokens do not equal browser cookies; no session cookie import is implemented.
- Production user authentication, per-user credential isolation, encrypted token persistence, refresh token revocation at Canvas, and account deletion.
- Real-account browser and Canvas end-to-end tests.
- Accessibility, privacy, security and multi-user load audits.

**Release gate:** Do not call this 90% production ready or deploy publicly until the above requirements are met. The local-beta code can be evaluated with a consenting Canvas test account and a registered developer key. Never ask a user to paste their Canvas password into Finessers.
