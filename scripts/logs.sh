#!/bin/bash
#
# 查看服務日誌
# 用法: ./scripts/logs.sh [service] [--follow]
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

COMPOSE_CMD=$(get_compose_cmd)

SERVICE=""
FOLLOW=""

for arg in "$@"; do
    case $arg in
        --follow|-f)
            FOLLOW="-f"
            ;;
        *)
            SERVICE="$arg"
            ;;
    esac
done

if [ -z "$SERVICE" ]; then
    $COMPOSE_CMD logs --tail=100 $FOLLOW
else
    $COMPOSE_CMD logs --tail=100 $FOLLOW "$SERVICE"
fi
