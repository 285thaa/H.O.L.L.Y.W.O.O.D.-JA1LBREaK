# H.OL.L.Y.W.O.O.D. Ja1lbreåk — Cloudflare edition (v1.2)

The 285 Garage developer command center, rebuilt to run entirely on your Cloudflare account:
a Cloudflare Worker (backend + pages) and a D1 database (users, notes, sessions). No PHP or MySQL host needed.

## What's new in v1.2
- **Legal pages** (public): `/legal`, `/legal/terms`, `/legal/privacy`, `/legal/copyright`. They describe what this app actually stores. Set the `CONTACT_EMAIL` var in `wrangler.jsonc` (use a business address, not a personal one).
- **Footer + login page** now show copyright and links to the legal pages; third-party "not affiliated" notice added.
- **Delete notes** (with confirmation), empty-state message, and a "do not store secrets" reminder.
- **UI:** skip link, keyboard focus outlines, screen-reader labels, `aria-current` navigation, loading/disabled buttons, Ctrl+Enter to run, "Copy result" button, toast messages, swipeable mobile nav, `#notes`-style deep links, reduced-motion support.
- **Fix:** the old stylesheet imported Google Fonts, which the app's own Content-Security-Policy blocks, so fonts never loaded. Now uses a system font stack (no external requests).
- **Hardening:** `X-Frame-Options`, `Cross-Origin-Opener-Policy`, HSTS `includeSubDomains`, `robots.txt` (keeps the app out of search; legal pages stay indexable), `noindex` on private pages.
- Service-worker cache bumped to v2 so the tablet picks up the new files.

Upgrading from v1.1: just redeploy (`npx wrangler deploy`). No database changes.

**Embedding on 285garage.com:** link to it (new tab). Do not iframe it: `frame-ancestors 'none'` blocks that on purpose. Ready-made button: `../285garage-site-kit/snippets/launcher-button.html`.

## What you need
- A computer with Node.js 20+ (the deploy commands run there, not on the tablet)
- Your Cloudflare account (free plan is enough to start)

## Deploy (about 10 minutes)
Run these in this folder:

1. `npm install`
2. `npx wrangler login` (opens a browser to authorize; you never share your password with anyone)
3. `npx wrangler d1 create hollywood-jailbreak`
   Copy the `database_id` it prints into `wrangler.jsonc` (replace `REPLACE_WITH_ID_FROM_wrangler_d1_create`).
4. `npm run db:remote` (creates the tables)
5. `npx wrangler secret put SETUP_TOKEN` and type a long random string. You'll need it once, at setup.
6. `npx wrangler deploy`
7. Put it on your domain: in the Cloudflare dashboard open Workers & Pages > hollywood-jailbreak > Settings > Domains & Routes > Add > Custom domain, and enter e.g. `tools.285garage.com`. (Or uncomment the `routes` line in `wrangler.jsonc` and deploy again.)
8. Visit `https://tools.285garage.com/setup`, enter the setup token, and create your admin account (14+ character password). Setup locks itself once an account exists. After that you can run `npx wrangler secret delete SETUP_TOKEN`.
9. Sign in at `/login`.

## Optional: AI assistant
The assistant calls any OpenAI-compatible `/chat/completions` endpoint, server-side only.
1. `npx wrangler secret put AI_API_KEY`
2. In `wrangler.jsonc` set `AI_ENABLED` to `"true"` and adjust `AI_BASE_URL` / `AI_MODEL` if you don't use the defaults.
3. `npx wrangler deploy`
Without a key, the dashboard still works in local mode (commands, notes). The key is never sent to the browser or stored in the app.

## Media Studio (server processing)

Media Studio currently provides FFmpeg MP4 conversion directly in the browser using FFmpeg WebAssembly. Source media stays on the user's device; no Docker server, Worker secret, or media upload is needed for this operation. The FFmpeg wrapper and core are loaded from jsDelivr on first use (approximately 32 MB). PySceneDetect, Auto-Editor, WhisperX, and Remotion remain planned server-side integrations and are not enabled in this browser-only mode.

## Android app (APK) for your tablet
The site is an installable PWA (manifest, service worker, icons, offline page). Media Studio processing requires the separately deployed media server; the APK is a client shell and does not contain the video/AI engines.
- Quick way: open the site in Chrome on the tablet > menu > Install app.
- APK: go to https://www.pwabuilder.com, enter your site's HTTPS URL, choose Android, download the package, and sideload it.
The service worker caches static files only. Signed-in pages and `/api` always go to the server.

## Local testing (optional)
Copy `.dev.vars.example` to `.dev.vars`, run `npm run db:local`, then `npm run dev`.

## Security notes
- Passwords are hashed with PBKDF2-SHA256. Sessions are random tokens stored hashed in D1, in `__Host-` HttpOnly Secure cookies (12 hours).
- CSRF tokens on every form and API call, origin checks, per-IP login limits and per-user API limits.
- Strict Content-Security-Policy; all user content is HTML-escaped.
- Keep your Cloudflare and Google accounts on 2-step verification.
- AI output is advisory: review and test code before using it.

## Layout
- `src/worker.js` routes, login/setup, API · `src/auth.js` hashing, sessions, rate limit · `src/views.js` pages
- `public/` static files (CSS, JS, icons, manifest, service worker) · `schema.sql` database tables · `wrangler.jsonc` config


## Automated deployment

GitHub Actions deploys this Worker to Cloudflare on pushes to `main` that change `cloudflare/**`. The repository must have an Actions secret named `CLOUDFLARE_API_TOKEN` with Workers Scripts Edit and D1 Edit permissions for the target account. The workflow also applies `schema.sql` to the remote D1 database before deployment.
