#!/usr/bin/env bash
# Apply every Supabase migration (plus seed) to a throwaway local PostgreSQL and
# verify Row Level Security. Needs PostgreSQL server binaries (initdb, pg_ctl).
#   bash web/supabase/tests/run.sh
set -euo pipefail

cd "$(dirname "$0")/.."
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${PGPORT_TEST:-54329}"
DATA="$(mktemp -d)"

# PostgreSQL refuses to run as root; use the postgres account when we are root.
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$DATA"

as_pg "'$PGBIN/initdb' -D '$DATA' -A trust -U postgres >/dev/null"
as_pg "'$PGBIN/pg_ctl' -D '$DATA' -o '-p $PORT -k $DATA -c listen_addresses=' -l '$DATA/log' -w start >/dev/null"
cleanup() { as_pg "'$PGBIN/pg_ctl' -D '$DATA' -m fast stop >/dev/null" || true; rm -rf "$DATA"; }
trap cleanup EXIT

psql_run() { psql -h "$DATA" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

psql_run -f tests/supabase-shim.sql
for migration in migrations/*.sql; do
  echo "applying $migration"
  psql_run -f "$migration"
done
echo "applying seed.sql"
psql_run -f seed.sql
psql_run -f tests/rls.test.sql
