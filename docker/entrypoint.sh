#!/bin/sh
set -e

mkdir -p /data

if [ ! -f /data/prod.db ]; then
  echo "[entrypoint] Creating database at /data/prod.db ..."
  npx prisma db push
  echo "[entrypoint] Seeding initial data ..."
  node --import tsx scripts/seed.mjs
  echo "[entrypoint] Database ready."
else
  echo "[entrypoint] Using existing database at /data/prod.db"
  npx prisma db push
fi

exec "$@"
