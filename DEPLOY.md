# SPIFF Tracker — Cloudflare Deployment Guide

## What this stack uses
- **Cloudflare Pages** — hosts the frontend (free)
- **Cloudflare D1** — SQLite database that persists all state (free tier)
- **Cloudflare Pages Functions** — the tiny API backend (free)
All three are free under Cloudflare's generous free tier.

---

## Step 1 — Install Wrangler (Cloudflare CLI)
```bash
npm install -g wrangler
wrangler login
```

---

## Step 2 — Create your D1 database
```bash
npx wrangler d1 create spiff-tracker
```
This prints something like:
```
database_id = "abc123-def456-..."
```
Copy that ID and paste it into `wrangler.toml` replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

---

## Step 3 — Initialize the database schema
```bash
npx wrangler d1 execute spiff-tracker --file=schema.sql
```

---

## Step 4 — Deploy to Cloudflare Pages

### Option A: Connect your GitHub repo (recommended — auto-deploys on push)
1. Push this entire folder to a GitHub repo
2. Go to https://dash.cloudflare.com → Pages → Create a project
3. Connect GitHub, select your repo
4. Build settings:
   - Build command: *(leave blank)*
   - Build output directory: `public`
5. Click Deploy

### Option B: Deploy directly from CLI
```bash
npx wrangler pages deploy public --project-name=spiff-tracker
```

---

## Step 5 — Link your D1 database to the Pages project
1. In Cloudflare Dashboard → Pages → your project → Settings → Functions
2. Under "D1 database bindings", add:
   - Variable name: `DB`
   - D1 database: `spiff-tracker`
3. Save and redeploy

---

## Step 6 — Set your admin password as an environment variable
1. In Cloudflare Dashboard → Pages → your project → Settings → Environment variables
2. Add:
   - Variable name: `ADMIN_PASSWORD`
   - Value: *(your chosen password — change from the default!)*
3. Mark it as a secret (encrypted)
4. Save and redeploy

---

## Step 7 — Connect your custom domain
1. In Cloudflare Dashboard → Pages → your project → Custom domains
2. Click "Set up a custom domain"
3. Enter your domain (e.g. `spiff.yourdomain.com`)
4. Since your domain is already on Cloudflare DNS, it will auto-configure
5. Done — your tracker is live at your custom domain

---

## Changing the admin password
Update the `ADMIN_PASSWORD` environment variable in Cloudflare Pages settings.
The default password in the code is `spiff2025` — change this before deploying!

---

## File structure
```
spiff-tracker/
├── public/
│   └── index.html          ← the entire frontend
├── functions/
│   └── api/
│       ├── auth.js          ← POST /api/auth (login check)
│       └── state.js         ← GET/POST /api/state (read/write DB)
├── schema.sql               ← run once to create DB table
├── wrangler.toml            ← Cloudflare config (update database_id!)
└── DEPLOY.md                ← this file
```

---

## Local development
```bash
npx wrangler pages dev public --d1=DB=spiff-tracker
```
This runs a local server with the D1 database bound so you can test before deploying.
