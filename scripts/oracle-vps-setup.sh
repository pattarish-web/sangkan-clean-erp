#!/usr/bin/env bash
# รันครั้งเดียวบน VPS (Ubuntu 22.04/24.04 หรือ Debian 12/13 บน GCP)
set -euo pipefail

echo "==> Installing Docker ..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings

if [ -f /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  OS_ID="${ID:-ubuntu}"
  CODENAME="${VERSION_CODENAME:-}"
else
  OS_ID="ubuntu"
  CODENAME="jammy"
fi

install_via_convenience_script() {
  echo ">> Using Docker convenience script (get.docker.com) ..."
  sudo rm -f /etc/apt/sources.list.d/docker.list
  curl -fsSL https://get.docker.com | sudo sh
}

case "$OS_ID" in
  debian)
    DOCKER_REPO="debian"
    case "$CODENAME" in
      trixie|sid|"") CODENAME="bookworm" ;;
    esac
    ;;
  ubuntu)
    DOCKER_REPO="ubuntu"
    ;;
  *)
    install_via_convenience_script
    sudo usermod -aG docker "$USER" || true
    echo "==> Docker installed."
    exit 0
    ;;
esac

echo ">> OS: ${OS_ID} (${VERSION_CODENAME:-unknown}) → Docker repo: ${DOCKER_REPO}/${CODENAME}"

sudo curl -fsSL "https://download.docker.com/linux/${DOCKER_REPO}/gpg" -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${DOCKER_REPO} \
  ${CODENAME} stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

if ! sudo apt-get update; then
  install_via_convenience_script
elif ! sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin; then
  install_via_convenience_script
fi

sudo usermod -aG docker "$USER" || true

echo "==> Docker installed."
echo "    Log out and back in (or run: newgrp docker) before docker commands without sudo."
echo ""
echo "Next: bash scripts/gcp-first-deploy.sh"
