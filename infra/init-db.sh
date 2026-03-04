#!/usr/bin/env bash
set -euo pipefail

su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='invenzo'\"" | grep -q 1 || \
  su - postgres -c "psql -c \"CREATE ROLE invenzo LOGIN PASSWORD 'invenzo';\""

su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='invenzo'\"" | grep -q 1 || \
  su - postgres -c "createdb -O invenzo invenzo"

cd /app/apps/api
# Apply migrations when available; otherwise push schema for fresh setups.
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy || true
else
  npx prisma db push || true
fi

psql "$DATABASE_URL" -f /app/apps/api/prisma/rls.sql || true
