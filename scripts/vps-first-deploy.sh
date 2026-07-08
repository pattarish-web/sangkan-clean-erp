#!/usr/bin/env bash
# รันบน Oracle VPS หลัง clone โปรเจกต์ — ติดตั้ง Docker + deploy ครั้งแรก
# ใช้: bash scripts/vps-first-deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"

echo "=============================================="
echo " Sangkan Clean — First deploy on VPS"
echo "=============================================="

if ! command -v docker >/dev/null 2>&1; then
  echo ">> Docker not found. Installing ..."
  bash "$APP_DIR/scripts/oracle-vps-setup.sh"
  echo ""
  echo ">> Docker installed. Re-run this script after logout/login:"
  echo "   bash scripts/vps-first-deploy.sh"
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo ">> Docker needs permission. Run: newgrp docker"
  echo "   Then: bash scripts/vps-first-deploy.sh"
  exit 1
fi

# เปิด port 3000 ใน firewall ของเครื่อง (Oracle Ubuntu มักบล็อก)
if command -v iptables >/dev/null 2>&1; then
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
  if command -v netfilter-persistent >/dev/null 2>&1; then
    sudo netfilter-persistent save 2>/dev/null || true
  fi
fi

echo ">> Building and starting (simple mode, port 3000) ..."
docker compose -f docker-compose.dev.yml up -d --build

echo ""
echo ">> Waiting for app to be ready ..."
sleep 8

PUBLIC_IP=""
PUBLIC_IP=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || curl -fsS --max-time 5 ifconfig.me 2>/dev/null || true)

echo ""
echo "=============================================="
echo " Deploy finished!"
if [ -n "$PUBLIC_IP" ]; then
  echo " Open: http://${PUBLIC_IP}:3000"
  echo " Login: SKC0001 / 5678"
else
  echo " Open: http://<your-vps-ip>:3000"
fi
echo ""
echo " Update later: bash scripts/vps-update.sh"
echo " Logs: docker compose -f docker-compose.dev.yml logs -f app"
echo "=============================================="
