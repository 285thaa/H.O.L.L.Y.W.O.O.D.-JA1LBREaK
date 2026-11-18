# Third-party components and licensing notes

This server installs tools from their upstream packages; it does not bundle the uploaded source archives as compiled binaries.

- **FFmpeg**: primarily LGPL with optional GPL components. The container uses the distribution FFmpeg build. Review `ffmpeg -L` and the distribution build configuration before redistribution; comply with the exact enabled codec/library licenses.
- **PySceneDetect**: BSD-3-Clause. See `THIRD_PARTY_LICENSES/PYSCENEDETECT-BSD-3-CLAUSE.txt`.
- **Auto-Editor**: its repository README states the project source is public domain (Unlicense); separately downloaded binary artifacts may have other licenses. See `THIRD_PARTY_LICENSES/AUTO-EDITOR-UNLICENSE.txt`.
- **WhisperX**: the supplied source archive contains a BSD 2-Clause license (Copyright © 2024 Max Bain); see `THIRD_PARTY_LICENSES/WHISPERX-BSD-2-CLAUSE.txt`. Model weights and dependencies have separate terms. Diarization may require an authorized Hugging Face token and gated model access.
- **Remotion**: The supplied Remotion source describes a free license for individuals, organizations with up to 3 employees, nonprofits, and evaluation; larger for-profit organizations require a company license. The license from the supplied source is included at `THIRD_PARTY_LICENSES/REMOTION-LICENSE.md`; verify that it remains current before use.

The supplied Auto-Editor Nim source is included under `vendor/auto-editor` (source-only subset required for compilation) and is built into a server-side executable. The integration does not compile the full FFmpeg source archive or place these tools inside the Android APK.
