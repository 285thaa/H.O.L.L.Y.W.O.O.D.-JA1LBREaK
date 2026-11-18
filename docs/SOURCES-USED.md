# Source packages used for Hollywood Jailbreak Media Studio

The integration was built against the user-provided source archives:

- `Hollywood-Jailbreak-Tool.zip` — existing Cloudflare Worker + D1 app and PHP alternative. The Cloudflare app is the active integration target; existing login, notes, command tools, security center, legal pages, and PWA shell are retained.
- `FFmpeg-master.zip` — upstream FFmpeg source README identifies FFmpeg's media libraries and command-line tools; the server uses the distro FFmpeg package for its convert operation and for PySceneDetect.
- `PySceneDetect-main.zip` — BSD-3-Clause project; command examples support `scenedetect -i video.mp4 detect-content list-scenes`.
- `auto-editor-master.zip` — current source identifies itself as a Nim project requiring Nim >=2.2.2 and nimcrypto 0.7.3; the minimal required source tree is included under `media-server/vendor/auto-editor` and built in the Docker image.
- `whisperX-main.zip` — BSD 2-Clause license; CLI supports `--output_format all`, `--device cpu`, `--compute_type int8`, and optional `--hf_token`/`--diarize`.
- `remotion-main.zip` — source package version metadata reports Remotion 4.0.545 for the bundler and renderer. The integration pins those packages and includes a simple title-overlay composition. Review the supplied Remotion license before commercial use.

The source archives themselves are not copied wholesale into the deliverable. The Auto-Editor source subset required for the server build is included; the other tools are installed from their supported package/distribution interfaces at image build time. Model weights and transitive dependency licenses remain separately governed by their publishers.
