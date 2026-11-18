# Hollywood Jailbreak — integrated Media Studio build

This package adds a Media Studio section to the existing Cloudflare edition and a separate Docker media-processing service. The phone app remains one interface; processing happens on the server you control.

## What is integrated

- **FFmpeg** — video/audio conversion (H.264/AAC MP4 output).
- **PySceneDetect** — detect cuts and package scene reports.
- **Auto-Editor** — automatic silence-aware editing. The uploaded Auto-Editor repository is the Nim implementation, so the Docker build compiles it from the included source subset and its FFmpeg dependencies.
- **WhisperX** — speech transcription with word-level timestamps; speaker diarization is optional and requires a Hugging Face token plus access to the gated diarization model.
- **Remotion** — branded MP4 rendering with a title overlay.

## Important: this is an integration build, not a finished APK

The updated Cloudflare app and server code are prepared, and the backend API was locally smoke-tested for health, authentication, job creation, and per-user job isolation. The Docker image was not built here, and nothing has been deployed to your Cloudflare account or a VPS. A signed Android APK comes after the web app is live on HTTPS and the server is reachable. The existing app is already PWA-capable and can be installed from Chrome while that APK packaging step is pending.

## Current free mode — browser FFmpeg

The deployed app can start with browser-based FFmpeg MP4 conversion; no VPS, Docker service, API token, or payment card is required. Open Media Studio, choose a source file, and convert to MP4. FFmpeg WebAssembly is downloaded from jsDelivr on first use (about 32 MB). Processing happens on the current device, so keep the page open and use smaller files on phones. PySceneDetect, Auto-Editor, WhisperX, and Remotion are not enabled in this mode.

## Optional future mode — deploy the media server

You need a Linux VPS or dedicated server with Docker Engine + Compose, a public DNS name, HTTPS, and enough storage for uploaded videos and rendered outputs. WhisperX runs on CPU by default but is much faster with a compatible NVIDIA GPU. The first Docker build compiles Auto-Editor and its bundled FFmpeg dependency set, so allow significant build time, disk, RAM, and bandwidth.

On the server:

```bash
cd media-server
cp .env.example .env
openssl rand -hex 32
```

Put the generated value into `.env` as `MEDIA_API_TOKEN`. Keep it private. Then build and start:

```bash
docker compose up -d --build
curl http://127.0.0.1:8080/health
```

The service binds to `127.0.0.1:8080`, not the public interface. Put it behind an HTTPS reverse proxy. Example Caddy site (replace the hostname):

```caddy
media.YOUR-DOMAIN.com {
    reverse_proxy 127.0.0.1:8080
}
```

Point the hostname's DNS record to the VPS and allow inbound TCP 80/443 for certificate issuance and HTTPS. Keep port 8080 private.

## Step 2 — connect Cloudflare Worker to the server

In the Cloudflare Worker project folder (`hollywood-jailbreak-cloudflare-v1.2`):

1. Set `MEDIA_API_URL` in `wrangler.jsonc` to `https://media.YOUR-DOMAIN.com` (no trailing slash).
2. Run `npx wrangler secret put MEDIA_API_TOKEN` and enter the exact same token used in the server `.env`.
3. Confirm your D1 `database_id` is set in `wrangler.jsonc` and that the database schema has been applied.
4. Deploy with `npx wrangler deploy`.

The Worker keeps the media token server-side. The Android/browser client never receives it. The Worker checks the user's login session and CSRF token, and the media server checks that job status and downloads belong to the same authenticated user.

## Step 3 — test Media Studio

Sign in to Hollywood Jailbreak and open **Media Studio**. Try a short MP4 first. Recommended test order:

1. FFmpeg convert
2. PySceneDetect scenes
3. Auto-Editor
4. WhisperX transcription
5. Remotion title render

Uploads are currently limited to 100 MB through the Worker gateway (the UI recommends 95 MB or less). The server allows one active job per user in this starter build.

## Step 4 — Android APK packaging

After the HTTPS app domain is live and login/media workflows are tested, package the PWA as an Android app using PWABuilder or a Trusted Web Activity workflow. The APK will be a single app shell; heavy media processing remains on your server. Do not put the server token or any Cloudflare secret in the APK.

## Before inviting other users

This is a starter integration. Add a durable job queue, server-wide concurrency limits, per-user quotas, automated file retention/deletion, monitoring, backups, and a tested GPU deployment profile. Review all third-party licenses in `media-server/THIRD-PARTY-NOTICES.md` and `media-server/THIRD_PARTY_LICENSES/`, especially Remotion eligibility and FFmpeg's enabled GPL/LGPL components.
