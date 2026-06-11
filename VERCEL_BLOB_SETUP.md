# Vercel Blob setup (publish to link)

Published outlines are stored in Vercel Blob and served at `/p/[id]` on your domain.

## One-time setup

1. Open the [Vercel dashboard](https://vercel.com/dashboard) and select the **light-research** project (or the project for `notepad.connie.surf`).

2. Go to **Storage** → **Create Database** → **Blob** → connect it to this project.

3. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project automatically. Redeploy after connecting storage if publish returns 500.

4. Deploy with dependencies installed (`npm install` runs on Vercel from `package.json`).

## Verify

1. Open the app and click **↗** in the Outline panel title bar.
2. You should get a modal with a link like `https://notepad.connie.surf/p/abc123xyz`.
3. Open that link in a private window — it should show the exported outline HTML.

## Local development

Blob uploads need the token locally:

```bash
npm install
vercel env pull .env.local
vercel dev
```

Without `vercel dev`, the static `index.html` works but `/api/publish` will not.

## Migrating to Supabase later

Only these files touch storage:

- `api/publish.js` — replace `put()` with a Supabase insert or Storage upload
- `api/p/[id].js` — replace Blob `list`/`fetch` with a Supabase select or download

Public URLs stay `/p/[id]`; no link breakage for visitors.
