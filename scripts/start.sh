#!/bin/bash
#
# 啟動專案腳本
# 用法: ./scripts/start.sh [--build]
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
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 檢查 Docker 服務狀態
check_docker() {
    log_info "檢查 Docker 服務狀態..."
    
    if systemctl is-active --quiet docker 2>/dev/null; then
        log_success "Docker 服務運行中"
        return 0
    fi

    log_warn "Docker 服務未運行，嘗試啟動..."
    
    if command -v sudo &> /dev/null; then
        sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null
    else
        systemctl start docker 2>/dev/null || service docker start 2>/dev/null
    fi

    sleep 2
    
    if systemctl is-active --quiet docker 2>/dev/null || docker info &>/dev/null; then
        log_success "Docker 服務已啟動"
        return 0
    else
        log_error "Docker 服務啟動失敗"
        exit 1
    fi
}

# 選擇 docker compose 命令
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        log_error "找不到 docker compose 或 docker-compose"
        exit 1
    fi
}

# 主程式
main() {
    local BUILD_FLAG=""
    
    if [[ "$1" == "--build" ]]; then
        BUILD_FLAG="--build"
        log_info "將重新建置映像檔..."
    fi

    check_docker
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    echo ""
    echo "========================================"
    log_info "正在啟動專案容器..."
    echo "========================================"
    
    $COMPOSE_CMD up -d $BUILD_FLAG
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================"
        log_success "專案已成功啟動！"
        echo "========================================"
        
        if [ -f .env ]; then
            source .env
            echo ""
            log_info "服務端點:"
            echo "  Frontend: http://localhost:${FRONTEND_PORT:-9102}"
            echo "  Backend:  http://localhost:${BACKEND_PORT:-9202}"
            echo "  DB:       localhost:${DB_EXTERNAL_PORT:-9302}"
        fi
        echo "========================================"
    else
        log_error "專案啟動失敗，請檢查 docker compose logs"
        exit 1
    fi
}

main "$@"
