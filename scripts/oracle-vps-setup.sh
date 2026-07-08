#!/usr/bin/env bash
# รันครั้งเดียวบน Oracle Cloud VPS (Ubuntu 22.04/24.04)
set -euo pipefail

echo "==> Installing Docker ..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER" || true

echo "==> Docker installed."
echo "    Log out and back in (or run: newgrp docker) before docker commands without sudo."
echo ""
echo "Next steps:"
echo "  1. git clone <your-repo> ~/sangkan-clean && cd ~/sangkan-clean"
echo "  2. cp .env.production.example .env"
echo "  3. Edit .env → set DOMAIN and ACME_EMAIL"
echo "  4. docker compose up -d --build"
echo ""
echo "Oracle Cloud: open ingress TCP 22, 80, 443 in Security List + VCN."
