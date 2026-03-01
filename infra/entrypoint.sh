#!/usr/bin/env bash
set -euo pipefail

if [ ! -s /var/lib/postgresql/data/PG_VERSION ]; then
  su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data"
fi

cat >/etc/postgresql/15/main/pg_hba.conf <<'EOF'
local all all trust
host all all 127.0.0.1/32 md5
host all all ::1/128 md5
host all all 0.0.0.0/0 md5
EOF

cat >/etc/postgresql/15/main/postgresql.conf <<'EOF'
data_directory = '/var/lib/postgresql/data'
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 128MB
logging_collector = on
log_destination = 'stderr'
EOF

chown -R postgres:postgres /var/lib/postgresql/data /run/postgresql

service postgresql start

/init-db.sh

service postgresql stop

exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
