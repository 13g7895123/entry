#!/bin/bash
#
# 健康檢查腳本
# 用法: ./scripts/health.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 載入環境變數
if [ -f .env ]; then
    source .env
fi

BACKEND_PORT=${BACKEND_PORT:-9202}
FRONTEND_PORT=${FRONTEND_PORT:-9102}

echo ""
echo "========================================"
echo -e "${CYAN}服務健康狀態${NC}"
echo "========================================"

# 檢查後端
if curl -sf "http://localhost:${BACKEND_PORT}/docs" > /dev/null 2>&1; then
    echo -e "Backend:        ${GREEN}● 健康${NC}"
else
    echo -e "Backend:        ${RED}● 異常${NC}"
fi

# 檢查前端 (透過 nginx)
if curl -sf "http://localhost:${FRONTEND_PORT}/health" > /dev/null 2>&1; then
    echo -e "Frontend/Nginx: ${GREEN}● 健康${NC}"
else
    echo -e "Frontend/Nginx: ${RED}● 異常${NC}"
fi

# 檢查資料庫
if docker exec entry-db pg_isready -U ${POSTGRES_USER:-entry_admin} > /dev/null 2>&1; then
    echo -e "Database:       ${GREEN}● 健康${NC}"
else
    echo -e "Database:       ${RED}● 異常${NC}"
fi

# 顯示容器狀態
echo ""
echo "容器狀態:"
echo "----------------------------------------"
docker ps --filter "name=entry-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "無法取得容器狀態"

echo "========================================"
echo ""
