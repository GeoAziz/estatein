#!/usr/bin/env bash
# Bring up the full stack and expose it through a single ngrok tunnel.
#
# Everything (frontend static build + backend API) sits behind the reverse
# proxy defined in nginx.conf, which is the only container publishing a port
# (80). That matches ngrok's free-tier limit of one tunnel/agent at a time —
# ngrok only ever needs to forward to that one port.
set -euo pipefail

cd "$(dirname "$0")/.."

NGROK_DOMAIN="${NGROK_DOMAIN:-sadden-glamorous-badness.ngrok-free.dev}"

echo "==> Building and starting services..."
docker compose up -d --build

echo "==> Waiting for the reverse proxy to become healthy..."
for _ in $(seq 1 30); do
  if curl -sf http://localhost:80/health >/dev/null 2>&1; then
    echo "==> nginx is up."
    break
  fi
  sleep 2
done

if ! curl -sf http://localhost:80/health >/dev/null 2>&1; then
  echo "!! nginx never became healthy — check 'docker compose logs' before tunneling." >&2
  exit 1
fi

echo "==> Starting ngrok tunnel on ${NGROK_DOMAIN}..."
exec ngrok http --url="${NGROK_DOMAIN}" 80
