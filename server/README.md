# Finessers Canvas connector (local, read-only)

This is a development integration, not a production authentication system.

1. Find your school's official Canvas domain (for example, https://school.instructure.com). Use the domain you actually log into.
2. If your school permits personal access tokens, create a limited-duration Canvas access token in Canvas Account > Settings > Approved Integrations > New Access Token. Some schools disable this feature.
3. In a **separate Terminal window**, from the project directory, run:

```bash
export CANVAS_BASE_URL="https://YOUR-SCHOOL-CANVAS-DOMAIN"
export CANVAS_ACCESS_TOKEN="YOUR_PRIVATE_TOKEN"
npm run api
```

4. In your original Terminal window, run `npm run dev`, then open the Finessers workspace and select **CANVAS DEADLINES**.

Do not paste tokens into chat, source files, browser fields, or GitHub. Stop the local API with Ctrl+C. The connector binds to localhost and supports read-only requests. It does not perform browser automation, submit coursework, or store tokens in the frontend.

For a public hosted version, replace personal tokens with a proper server-side OAuth integration, user accounts, encrypted credential storage, and per-user authorization. GitHub Pages alone cannot host this API.
