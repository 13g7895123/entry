#!/bin/bash
#
# 建置專案
# 用法: ./scripts/build.sh [service]
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

COMPOSE_CMD=$(get_compose_cmd)
SERVICE=$1

echo "========================================"
log_info "開始建置..."
echo "========================================"

if [ -z "$SERVICE" ]; then
    $COMPOSE_CMD build --parallel
else
    $COMPOSE_CMD build "$SERVICE"
fi

echo ""
log_success "建置完成！"
echo "========================================"
