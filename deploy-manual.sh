#!/usr/bin/env bash
set -euo pipefail

APP_NAME="lms-be-v2"
COMPOSE_URL="https://raw.githubusercontent.com/minhhquann1508/lms-be-v2/develop/docker-compose.yml"
COMPOSE_FILE="docker-compose.yml"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

step() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  else
    fail "Docker Compose is not installed."
  fi
}

require_env() {
  local missing=0
  for name in "$@"; do
    if [ -z "${!name:-}" ]; then
      echo "Missing required env: $name" >&2
      missing=1
    fi
  done
  [ "$missing" -eq 0 ] || fail "Please fill required values in .env and run ./deploy-manual.sh again."
}

step "Checking Docker"
command -v docker >/dev/null 2>&1 || fail "Docker is not installed."
docker info >/dev/null 2>&1 || fail "Docker daemon is not running or current user cannot access it."

step "Checking Docker Compose"
compose version >/dev/null

step "Loading .env"
[ -f ".env" ] || fail ".env file is required for backend deployment."
set -a
# shellcheck disable=SC1091
. ./.env
set +a

step "Validating deploy variables"
export IMAGE_TAG="${IMAGE_TAG:-latest}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
require_env \
  BACKEND_URL \
  FRONTEND_URL \
  OAUTH_STATE_SECRET \
  DATABASE_USERNAME \
  DATABASE_PASSWORD \
  DATABASE_NAME \
  PASSWORD_HASH_SALT \
  JWT_SECRET \
  JWT_REFRESH_SECRET \
  JWT_ACCESS_TOKEN_EXPIRES_IN \
  JWT_REFRESH_TOKEN_EXPIRES_IN \
  REFRESH_TOKEN_TTL_DAYS \
  MAX_ATTEMPTS_RETRY \
  WORKER_MODE \
  BUNNY_API_URL \
  MAXIMUM_DESKTOP_DEVICE_COUNT \
  MAXIMUM_MOBILE_DEVICE_COUNT

step "Downloading latest compose file"
tmp_file="$(mktemp)"
curl -fsSL "$COMPOSE_URL" -o "$tmp_file" || fail "Cannot download $COMPOSE_URL"
mv "$tmp_file" "$COMPOSE_FILE"

step "Pulling Docker images"
compose pull

step "Running database migrations"
compose up --force-recreate migrate

step "Seeding base data safely"
compose up --force-recreate seed

step "Starting $APP_NAME"
compose up -d --remove-orphans backend

step "Container status"
compose ps
