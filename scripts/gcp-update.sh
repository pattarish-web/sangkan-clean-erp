#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
git pull
docker compose -f docker-compose.dev.yml up -d --build
echo ">> GCP app updated."
