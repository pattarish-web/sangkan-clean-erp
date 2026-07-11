#!/usr/bin/env bash
# รันบน Google Cloud VM (Debian/Ubuntu) หลัง clone โปรเจกต์
# ใช้: bash scripts/gcp-first-deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"

echo "=============================================="
echo " Sangkan Clean — First deploy on Google Cloud"
echo "=============================================="

if ! command -v docker >/dev/null 2>&1; then
  echo ">> Docker not found. Installing ..."
  bash "$APP_DIR/scripts/oracle-vps-setup.sh"
  echo ""
  echo ">> Docker installed. Re-run after: newgrp docker"
  echo "   bash scripts/gcp-first-deploy.sh"
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo ">> Docker needs permission. Run: newgrp docker"
  echo "   Then: bash scripts/gcp-first-deploy.sh"
  exit 1
fi

echo ">> Building and starting (port 3000) ..."
docker compose -f docker-compose.dev.yml up -d --build

echo ">> Waiting for app ..."
sleep 10

PUBLIC_IP=""
PUBLIC_IP=$(curl -fsS -H "Metadata-Flavor: Google" --max-time 3 \
  "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip" 2>/dev/null || true)
if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)
fi

echo ""
echo "=============================================="
echo " Deploy finished!"
if [ -n "$PUBLIC_IP" ]; then
  echo " Open: http://${PUBLIC_IP}:3000"
else
  echo " Open: http://<EXTERNAL-IP>:3000"
  echo " (ดู IP ใน GCP Console > Compute Engine > VM instances)"
fi
echo " Login: SKC0001 / 5678"
echo ""
echo " ถ้าเปิดไม่ได้: เปิด Firewall port 3000 (ดู scripts/GCP-SETUP.txt)"
echo " Update: bash scripts/gcp-update.sh"
echo " Logs:  docker compose -f docker-compose.dev.yml logs -f app"
echo "=============================================="
