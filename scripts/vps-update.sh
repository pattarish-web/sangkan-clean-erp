#!/usr/bin/env bash
# อัปเดตโค้ดบน VPS หลัง git push
# ใช้: bash scripts/vps-update.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo ">> Pulling latest code ..."
git pull

echo ">> Rebuilding containers ..."
docker compose -f docker-compose.dev.yml up -d --build

echo ">> Done. App updated."
