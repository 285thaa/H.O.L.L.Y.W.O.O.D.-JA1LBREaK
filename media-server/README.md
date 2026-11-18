# Hollywood Jailbreak Media Engine (server architecture)

This is the processing backend for the Media Studio section added to the Hollywood Jailbreak Cloudflare Worker app. The Android app/PWA remains the user interface; media workloads run on this server.

## Included operations

- `scenes`: PySceneDetect scene detection/report archive.
- `auto_edit`: Auto-Editor silence-aware automatic edit. The supplied source is the Nim implementation (requires Nim 2.2.2+); the Docker image builds it from `vendor/auto-editor` and its pinned Nimble dependency.
- `transcribe`: WhisperX transcription output archive (word timestamps; diarization is enabled only when `HF_TOKEN` is supplied).
- `convert`: FFmpeg H.264/AAC MP4 conversion.
- `remotion`: Remotion branded video render with a title overlay.

## Deploy

1. Install Docker Engine and Docker Compose on a Linux server with enough disk space. For WhisperX CPU inference, expect slower processing; an NVIDIA GPU server is recommended for production throughput. GPU configuration is intentionally not assumed in this starter.
2. Copy `.env.example` to `.env`; set `MEDIA_API_TOKEN` to a long random value. Never put this token in the browser or Android app.
3. `docker compose up -d --build`
4. Verify locally: `curl http://127.0.0.1:8080/health`
5. Put the service behind HTTPS using a reverse proxy (Caddy/Nginx/Traefik). Do not expose port 8080 directly to the public internet. Configure upload-size/timeouts on the proxy; server upload limit defaults to 100 MB.
6. In the Cloudflare Worker project, set the backend URL and secret:
   - `npx wrangler secret put MEDIA_API_TOKEN` (same value as `.env`)
   - Add `MEDIA_API_URL` as a Worker variable, e.g. `https://media.example.com`
   - Deploy the Worker: `npx wrangler deploy`
7. Open Hollywood Jailbreak → Media Studio. Upload a supported media file (the Worker gateway currently caps each upload at 100 MB) and choose an operation.

The Worker authenticates the signed-in user, enforces CSRF on uploads, and forwards requests server-to-server using the secret. The media service binds each job to the user ID provided by the Worker and checks ownership on status/download requests.

## Supported upload types

MP4, MOV, MKV, WebM, AVI, M4V, MP3, WAV, M4A, AAC, FLAC, OGG. Server-side maximum defaults to 100 MB; the Worker gateway maximum is 100 MB (the app UI recommends files no larger than 95 MB). The smaller gateway limit protects the Cloudflare path; use direct-to-object-storage uploads for larger files in a later iteration.

## Operations and safety

- Persistent job data is stored in the `hollywood_media_data` Docker volume.
- The Docker image build compiles the supplied Auto-Editor source and its bundled FFmpeg dependency set (optional VPX, SVT-AV1, HEVC, built-in Whisper, VPL, and libass features are disabled to reduce build weight); this first build can take a long time and needs substantial RAM, disk space, and build tools. This starter keeps completed uploads/results until manually removed. Set up a retention/cleanup policy before accepting other users' uploads.
- Run this service on a trusted server, keep the API token secret, and terminate HTTPS at a reverse proxy.
- The initial worker uses one background thread per job; for multi-user production, replace this with a durable queue (Redis/Celery, Dramatiq, or a managed queue) and add quotas/concurrency limits.
- Jobs are long-running. Configure reverse proxy body size and timeout limits accordingly.
- WhisperX speaker diarization requires the correct model access and HF token; transcription without diarization does not need it.
- Remotion rendering uses a basic branded video composition. Remotion license terms must be reviewed for your usage.

## API (internal; requires Bearer token)

- `GET /health`
- `POST /v1/jobs` multipart fields: `file`, `operation`, optional `title`; internal header `X-HJ-User` is supplied by the Worker.
- `GET /v1/jobs/{id}`
- `GET /v1/jobs/{id}/output`

Do not expose these internal routes directly to browsers. Access them only through the authenticated Worker gateway or a trusted private network.
