FROM node:22-bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 CHOOSENIM_NO_ANALYTICS=1 DISABLE_VPX=1 DISABLE_SVTAV1=1 DISABLE_HEVC=1 DISABLE_WHISPER=1 DISABLE_VPL=1 DISABLE_LIBASS=1 HOME=/data/home
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-venv ffmpeg tini ca-certificates curl git build-essential pkg-config cmake meson ninja-build nasm yasm autoconf automake libtool libssl-dev zlib1g-dev libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 libx11-xcb1 libxss1 libxtst6 fonts-liberation && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:/root/.nimble/bin:$PATH"
WORKDIR /srv
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
# Auto-Editor in the supplied archive is the Nim implementation (Nim >= 2.2.2), not the older Python package.
RUN curl -fsSL https://nim-lang.org/choosenim/init.sh -o /tmp/choosenim.sh && sh /tmp/choosenim.sh -y && rm /tmp/choosenim.sh
COPY vendor/auto-editor /tmp/auto-editor
RUN cd /tmp/auto-editor && nimble install -y nimcrypto@0.7.3 && nimble makeff && nimble make && install -m 0755 auto-editor /usr/local/bin/auto-editor && rm -rf /tmp/auto-editor
WORKDIR /srv/remotion
COPY remotion/package.json ./package.json
RUN npm install --omit=dev
WORKDIR /srv
COPY app ./app
COPY remotion ./remotion
RUN mkdir -p /data/jobs /data/home && chown -R 10001:10001 /data /srv
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["tini","--"]
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8080"]
