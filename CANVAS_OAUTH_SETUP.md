# Canvas OAuth local-beta setup

Finessers supports Canvas OAuth authorization-code login with PKCE. This connects to the **Canvas REST API**. It does **not** inject Canvas cookies into Playwright or provide an authenticated Canvas website tab.

## Requirements

1. Register a Canvas developer key with the university Canvas administrator (institution approval may be required).
2. Configure the developer key's redirect URI exactly as `http://127.0.0.1:8787/api/canvas/oauth/callback`.
3. Configure environment variables before running `npm run start:all`:
   - `CANVAS_BASE_URL=https://your-university.instructure.com`
   - `CANVAS_OAUTH_CLIENT_ID=123456789`
   - `CANVAS_OAUTH_CLIENT_SECRET=...` (if required by the developer key)
4. Open Finessers → Tabs → Canvas Live → Connect Canvas. Complete the university's Canvas login in the new tab. Return to Finessers and click Check Connection.

Tokens and pending PKCE verifier/state are held in backend process memory only; restarting the API disconnects OAuth. Refresh tokens are never sent to the browser. The existing `CANVAS_ACCESS_TOKEN` environment variable remains a local-beta fallback. To verify OAuth is actually being used, unset `CANVAS_ACCESS_TOKEN`.

The OAuth callback is exempt from the same-origin browser-request check because Canvas redirects from a different site; the callback validates a one-time unpredictable state value before exchanging the authorization code. The API still binds to loopback only.

**Limitations:** no user accounts, no persistent encrypted token store, no full authenticated Playwright Canvas browsing, no production deployment, and no real university Canvas OAuth test without developer-key access. Do not expose the local API publicly.
