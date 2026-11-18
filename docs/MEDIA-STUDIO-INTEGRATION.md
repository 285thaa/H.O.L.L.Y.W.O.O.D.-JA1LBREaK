# Media Studio integration notes

This update adds a signed-in Media Studio navigation item and authenticated `/media` Worker gateway routes. The gateway expects `MEDIA_API_URL` and `MEDIA_API_TOKEN` Worker configuration. The separate `media-server/` directory is the Docker deployment for FFmpeg, PySceneDetect, Auto-Editor, WhisperX, and Remotion.

The Worker upload proxy currently enforces a 100 MB upload cap. Status and output downloads are scoped to the authenticated Worker user. Before public launch, add persistent queueing, concurrency/user quotas, retention cleanup, and a tested GPU deployment profile.
