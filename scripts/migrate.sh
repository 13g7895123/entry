#!/bin/bash
#
# 資料庫遷移腳本
# 用法: ./scripts/migrate.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

CONTAINER_NAME="portal-backend"

# 檢查容器是否運行
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_error "容器 ${CONTAINER_NAME} 未運行"
    log_info "請先執行 './scripts/start.sh'"
    exit 1
fi

log_info "在 ${CONTAINER_NAME} 中執行遷移腳本..."

# 執行遷移
if [ -f "$PROJECT_DIR/migrate_json_to_db.py" ]; then
    cat "$PROJECT_DIR/migrate_json_to_db.py" | docker exec -i ${CONTAINER_NAME} python3 -
else
    log_info "無遷移腳本需要執行"
    exit 0
fi

if [ $? -eq 0 ]; then
    log_success "遷移執行成功"
else
    log_error "遷移執行失敗"
    exit 1
fi
