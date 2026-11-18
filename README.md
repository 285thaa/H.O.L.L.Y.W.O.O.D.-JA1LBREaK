# Hollywood Jailbreak

Hollywood Jailbreak is a web/PWA interface with a separate server-side media engine.

## Project layout

- `cloudflare/` — Cloudflare Worker application, web assets, D1 schema, and Wrangler configuration.
- `media-server/` — Docker/FastAPI media processing service.
- `legacy/hollywood-jailbreak-php-v2/` — retained PHP implementation.
- `docs/` — setup notes, integration notes, build status, and source acknowledgements.

## Media operations present in the starter

- FFmpeg conversion
- PySceneDetect scene reports
- Auto-Editor automatic editing
- WhisperX transcription
- Remotion title-overlay rendering

The media engine is a starter implementation, not a deployed production service. The Docker image has not been built or deployed, and end-to-end processing has not been verified on a hosted server. Review `media-server/README.md` before deployment.

## Important status

- The Cloudflare Worker has not been deployed from this package.
- AI features remain disabled until credentials and intended behavior are configured.
- Android APK packaging/signing is not included or complete. The current interface is a web app/PWA; an APK still needs a native Android wrapper/build workflow and testing.
- Do not commit `.env` files, API tokens, signing keys, or other secrets.

## Start here

Read `docs/START-HERE.md`, then `docs/BUILD-STATUS.txt`, then `media-server/README.md`.
