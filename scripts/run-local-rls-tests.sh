#!/usr/bin/env bash
#
# Runs the hostile RLS suite against a throwaway PostgreSQL database.
#
# This applies the REAL migrations from supabase/migrations/ on top of a small
# shim that recreates the parts of Supabase the policies depend on (auth.users,
# auth.uid(), the anon/authenticated roles). It proves the policy logic before
# it ever reaches a live project, and it is safe to run as often as you like.
#
#   ./scripts/run-local-rls-tests.sh
#
# Point it at an existing database instead of starting one:
#
#   PP_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" \
#     ./scripts/run-local-rls-tests.sh
#
# (54322 is the port `supabase start` uses for its local Postgres.)
#
# NEVER point this at a hosted project: it truncates auth.users.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHIM="$ROOT/supabase/tests/00_supabase_shim.sql"
SUITE="$ROOT/supabase/tests/01_rls_hostile.sql"
MIGRATIONS=("$ROOT"/supabase/migrations/*.sql)

if [[ -n "${PP_DATABASE_URL:-}" ]]; then
  case "$PP_DATABASE_URL" in
    *supabase.co*|*supabase.com*)
      echo "Refusing to run: PP_DATABASE_URL points at a hosted Supabase project."
      echo "This suite truncates auth.users. Use a local database."
      exit 2
      ;;
  esac

  echo "Using existing database: ${PP_DATABASE_URL%%\?*}"
  psql "$PP_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$SHIM"
  for m in "${MIGRATIONS[@]}"; do
    echo "  applying $(basename "$m")"
    psql "$PP_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$m"
  done
  exec psql "$PP_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SUITE"
fi

# ---------------------------------------------------------------------------
# No database supplied: start a temporary cluster.
# ---------------------------------------------------------------------------

PGBIN="${PP_PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)}"
if [[ -z "$PGBIN" || ! -x "$PGBIN/initdb" ]]; then
  echo "Could not find PostgreSQL server binaries."
  echo "Install PostgreSQL, or set PP_DATABASE_URL to an existing database."
  echo "  macOS:  brew install postgresql@16"
  echo "  Ubuntu: sudo apt-get install postgresql-16"
  echo "  Or run 'supabase start' and use its database on port 54322."
  exit 2
fi

# initdb refuses to run as root, so fall back to the postgres system user.
RUN_AS=""
if [[ "$(id -u)" -eq 0 ]]; then
  if id -u postgres >/dev/null 2>&1; then
    RUN_AS="postgres"
  else
    echo "Running as root and no 'postgres' user exists. Re-run as a normal user."
    exit 2
  fi
fi

if [[ -n "$RUN_AS" ]]; then
  PGROOT="$(getent passwd "$RUN_AS" | cut -d: -f6)/propertypilot-rls"
else
  PGROOT="${TMPDIR:-/tmp}/propertypilot-rls-$$"
fi

PORT="${PP_PGPORT:-55432}"

as_pg () {
  if [[ -n "$RUN_AS" ]]; then su "$RUN_AS" -c "$1"; else bash -c "$1"; fi
}

cleanup () {
  as_pg "$PGBIN/pg_ctl -D $PGROOT/data -m immediate stop" >/dev/null 2>&1 || true
  rm -rf "$PGROOT" 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting a temporary PostgreSQL cluster on port $PORT…"
rm -rf "$PGROOT"
mkdir -p "$PGROOT/data" "$PGROOT/run"
[[ -n "$RUN_AS" ]] && chown -R "$RUN_AS:$RUN_AS" "$PGROOT"

as_pg "$PGBIN/initdb -D $PGROOT/data -U propertypilot --auth=trust" >/dev/null
as_pg "$PGBIN/pg_ctl -D $PGROOT/data -l $PGROOT/pg.log -o '-p $PORT -k $PGROOT/run -c listen_addresses=' -w start" >/dev/null

PSQL="$PGBIN/psql -h $PGROOT/run -p $PORT -U propertypilot -v ON_ERROR_STOP=1"
as_pg "$PSQL -d postgres -q -c 'create database pptest;'"

# The postgres user has to be able to read the SQL files.
chmod -R a+rX "$ROOT/supabase"

echo "Applying the Supabase shim and the real migrations…"
as_pg "$PSQL -d pptest -q -f $SHIM"
for m in "${MIGRATIONS[@]}"; do
  echo "  applying $(basename "$m")"
  as_pg "$PSQL -d pptest -q -f $m"
done

echo "Running the hostile RLS suite…"
as_pg "$PSQL -d pptest -f $SUITE"
