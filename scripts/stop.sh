#!/bin/bash
#
# 停止專案腳本
# 用法: ./scripts/stop.sh [--clean]
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# 選擇 docker compose 命令
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

main() {
    COMPOSE_CMD=$(get_compose_cmd)
    
    echo "========================================"
    log_info "正在停止專案容器..."
    echo "========================================"
    
    if [[ "$1" == "--clean" ]]; then
        log_warn "將清除所有容器和未使用的映像檔..."
        $COMPOSE_CMD down --rmi local --remove-orphans
    else
        $COMPOSE_CMD down
    fi
    
    echo ""
    log_success "專案已停止"
    echo "========================================"
}

main "$@"
