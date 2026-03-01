#!/usr/bin/env bash
set -euo pipefail

su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='invenzo'\"" | grep -q 1 || \
  su - postgres -c "psql -c \"CREATE ROLE invenzo LOGIN PASSWORD 'invenzo';\""

su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='invenzo'\"" | grep -q 1 || \
  su - postgres -c "createdb -O invenzo invenzo"

cd /app/apps/api
npx prisma migrate deploy || true

psql "$DATABASE_URL" -f /app/apps/api/prisma/rls.sql || true
