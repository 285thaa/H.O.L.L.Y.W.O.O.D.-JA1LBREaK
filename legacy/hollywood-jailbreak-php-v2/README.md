# H.OL.L.Y.W.O.O.D. Ja1lbreåk — 285 Garage plugin

A PHP 8.1+ / MySQL 8 compatible, self-hosted developer command center.

## Included
- Crimson/black responsive dashboard
- Searchable, copyable command directory
- Code Lab presets for Lua/FiveM, PHP, JavaScript, Python, HTML/CSS and C#
- Developer tool prompts and project notes
- Optional OpenAI-compatible chat endpoint (server-side API key)
- Admin setup/login, CSRF protection, prepared SQL statements and basic session rate limiting
- Embeddable launcher button for an existing 285 Garage page

## Requirements
PHP 8.1+, PDO MySQL, cURL (only for AI requests), MySQL 8/MariaDB 10.5+.

## Install
1. Upload the `hollywood-jailbreak` folder to your hosting account, preferably outside the public web root; expose its `public` directory as the web root for the plugin subdomain/path.
2. Create a MySQL database and user.
3. Copy `config.example.php` to `config.php`, fill in database credentials and a long random `APP_KEY`.
4. Import `database/schema.sql`.
5. Visit `/setup.php` once to create the first admin. Delete `public/setup.php` immediately afterward.
6. Configure the AI endpoint and key in `config.php` if desired. The default endpoint is OpenAI-compatible; requests are made server-side. Never put the key in JavaScript.
7. Visit `/login.php`, sign in, and open the dashboard.

## Embed in 285 Garage
Host the plugin at a same-origin path such as `https://your-domain.example/tools/hollywood-jailbreak/`.
Add this to the desired page:
```html
<a class="hj-launcher" href="/tools/hollywood-jailbreak/" target="_blank" rel="noopener">
  Open H.OL.L.Y.W.O.O.D. Ja1lbreåk
</a>
```
For an inline panel, use:
```html
<iframe
  src="/tools/hollywood-jailbreak/"
  title="H.OL.L.Y.W.O.O.D. Ja1lbreåk"
  loading="lazy"
  style="width:100%;height:900px;border:0;border-radius:16px"
></iframe>
```
The iframe is optional; a separate tab is the safer default.

## AI setup
Set `AI_ENABLED=true`, `AI_BASE_URL`, `AI_MODEL`, and `AI_API_KEY` in `config.php`. The endpoint should accept an OpenAI-compatible `/chat/completions` request. If no API key is configured, the dashboard still works in local command/prompt mode. AI output is advisory: review and test code before deploying it.

## Production notes
- Serve only over HTTPS.
- Restrict admin access; use a unique password and rotate credentials.
- Keep `config.php` outside the public web root when possible.
- Back up the database and files before upgrades.
- Add a web-server rule denying access to `config.php`, `database/`, and `README.md` if the folder must live under the document root.
- This first release is a self-contained plugin package, not yet merged into the existing 285 Garage codebase. A copy of the current website source is needed for a native header/navigation integration and theme matching.

## Android app (APK) for your tablet
This package is installable as a Progressive Web App: `manifest.webmanifest`, `sw.js`, `offline.html` and icons are included.
1. Host the plugin over HTTPS (e.g. `https://tools.285garage.com/`) and finish the install steps above.
2. Open the site in Chrome on the tablet: menu > Install app / Add to Home screen. This already works as an app, no APK needed.
3. For a real APK: go to https://www.pwabuilder.com, enter the HTTPS URL, choose Android, and download the package. Sideload the APK on the tablet (allow installs from your browser/file manager).
4. Keep the AI API key in `config.php` on the server only. Never place it inside the app.
The service worker caches static files only. Logged-in pages and `api.php` always go to the server.
