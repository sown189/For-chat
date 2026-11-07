# Real Canvas integration verification

The automated CI suite uses a mock Canvas API and does not require or store student credentials. Round 25 adds a transport-to-navigation integration test covering courses, modules, module items, pages and assignments.

## Run against a consenting test account

1. Register or obtain an authorized Canvas developer key/token from your institution. Use only your own account or an explicitly authorized test account.
2. On your own computer, set `CANVAS_BASE_URL` to your institution's HTTPS Canvas origin and `CANVAS_ACCESS_TOKEN` to a scoped API token. **Never paste tokens into chat or commit them to GitHub.**
3. Run `npm run test:canvas-live`. This performs read-only calls for profile, courses, and first-course assignments/modules/pages. It reports counts and status only, not private course content or names.
4. For OAuth, follow `CANVAS_OAUTH_SETUP.md` and sign in through the Canvas consent flow. Then use the Canvas Live UI's Check Connection control.

## Browser authentication boundary

The OAuth access token is for Canvas API requests. It is not a Canvas website login cookie and cannot safely be converted to one. Finessers' isolated Playwright browser still opens unauthenticated Canvas pages; a student's own browser can open the original Canvas link using their existing school session. A secure, authorized browser-login flow requires a separate implementation and live institution testing.

## Release gate

A green GitHub build plus mocked integration tests is **not** proof that FAU Canvas login works. Real OAuth/SSO testing and multi-user account isolation remain blockers for public release.
