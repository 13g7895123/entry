#!/bin/bash
#
# 藍綠部署切換腳本
# 用法: ./scripts/deploy.sh [blue|green]
#
# 此腳本用於在藍綠環境之間切換流量
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
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

NGINX_CONF="$PROJECT_DIR/nginx/conf.d/default.conf"
NGINX_CONTAINER="portal-nginx"

# 取得當前活躍的環境
get_active_env() {
    if grep -q "server portal-frontend-blue:80;" "$NGINX_CONF" && ! grep -q "# server portal-frontend-blue:80;" "$NGINX_CONF"; then
        echo "blue"
    else
        echo "green"
    fi
}

# 取得 compose 命令
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# 健康檢查
health_check() {
    local container=$1
    local max_retries=30
    local retry=0
    
    log_info "等待 $container 健康檢查..."
    
    while [ $retry -lt $max_retries ]; do
        if docker exec "$container" curl -sf http://localhost:80 > /dev/null 2>&1; then
            log_success "$container 健康檢查通過"
            return 0
        fi
        retry=$((retry + 1))
        sleep 2
    done
    
    log_error "$container 健康檢查失敗"
    return 1
}

# 切換到指定環境
switch_to() {
    local target=$1
    local backup=$2
    
    log_info "切換流量到 ${target} 環境..."
    
    # 更新 nginx 設定
    if [ "$target" == "blue" ]; then
        sed -i 's/# server portal-frontend-blue:80;/server portal-frontend-blue:80;/' "$NGINX_CONF"
        sed -i 's/server portal-frontend-green:80;/# server portal-frontend-green:80;/' "$NGINX_CONF"
    else
        sed -i 's/server portal-frontend-blue:80;/# server portal-frontend-blue:80;/' "$NGINX_CONF"
        sed -i 's/# server portal-frontend-green:80;/server portal-frontend-green:80;/' "$NGINX_CONF"
    fi
    
    # 重載 nginx
    docker exec "$NGINX_CONTAINER" nginx -s reload
    
    log_success "已切換到 ${target} 環境"
}

# 部署新版本
deploy() {
    local target=$1
    COMPOSE_CMD=$(get_compose_cmd)
    
    log_info "正在部署新版本到 ${target} 環境..."
    
    # 建置並啟動目標容器
    $COMPOSE_CMD build "frontend-${target}"
    $COMPOSE_CMD up -d "frontend-${target}"
    
    # 健康檢查
    if ! health_check "portal-frontend-${target}"; then
        log_error "新版本部署失敗，保持原環境"
        return 1
    fi
    
    return 0
}

# 顯示狀態
show_status() {
    local active=$(get_active_env)
    
    echo ""
    echo "========================================"
    echo -e "${CYAN}藍綠部署狀態${NC}"
    echo "========================================"
    
    if [ "$active" == "blue" ]; then
        echo -e "  Blue:  ${GREEN}●${NC} 活躍中"
        echo -e "  Green: ${YELLOW}○${NC} 備用"
    else
        echo -e "  Blue:  ${YELLOW}○${NC} 備用"
        echo -e "  Green: ${GREEN}●${NC} 活躍中"
    fi
    
    echo "========================================"
    echo ""
}

# 主程式
main() {
    local action=$1
    local current_env=$(get_active_env)
    
    case "$action" in
        blue)
            if [ "$current_env" == "blue" ]; then
                log_warn "當前已經在 blue 環境"
                exit 0
            fi
            switch_to "blue" "green"
            ;;
        green)
            if [ "$current_env" == "green" ]; then
                log_warn "當前已經在 green 環境"
                exit 0
            fi
            switch_to "green" "blue"
            ;;
        status)
            show_status
            ;;
        auto)
            # 自動部署到非活躍環境
            if [ "$current_env" == "blue" ]; then
                target="green"
            else
                target="blue"
            fi
            
            log_info "自動部署: 當前=${current_env}, 目標=${target}"
            
            if deploy "$target"; then
                switch_to "$target" "$current_env"
                show_status
            fi
            ;;
        rollback)
            # 快速回滾到另一個環境
            if [ "$current_env" == "blue" ]; then
                switch_to "green" "blue"
            else
                switch_to "blue" "green"
            fi
            show_status
            ;;
        *)
            echo ""
            echo "用法: $0 {blue|green|status|auto|rollback}"
            echo ""
            echo "Commands:"
            echo "  blue      切換到藍色環境"
            echo "  green     切換到綠色環境"
            echo "  status    顯示當前狀態"
            echo "  auto      自動部署到非活躍環境並切換"
            echo "  rollback  快速回滾到備用環境"
            echo ""
            show_status
            exit 1
            ;;
    esac
}

main "$@"
