# Portal - CI/CD 部署指南

## 📁 專案結構

```
portal/
├── .github/workflows/      # GitHub Actions CI/CD 工作流程
│   ├── ci.yml              # 持續整合 (測試、建置驗證)
│   └── deploy-prod.yml     # 正式環境部署
├── nginx/                  # Nginx 反向代理設定
│   ├── nginx.conf          # 主設定檔
│   └── conf.d/
│       └── default.conf    # 藍綠部署設定
├── scripts/               # 部署腳本
│   ├── start.sh           # 啟動服務
│   ├── stop.sh            # 停止服務
│   ├── build.sh           # 建置映像檔
│   ├── deploy.sh          # 藍綠部署切換
│   ├── migrate.sh         # 資料庫遷移
│   ├── logs.sh            # 查看日誌
│   └── health.sh          # 健康檢查
├── backend/               # 後端應用程式
├── frontend/              # 前端應用程式
├── docker-compose.yml     # Docker 編排設定
├── .env                   # 環境變數 (勿提交)
└── .env.example           # 環境變數範本
```

## 🚀 快速開始

### 1. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env 填入實際值
```

### 2. 啟動服務

```bash
./scripts/start.sh          # 正常啟動
./scripts/start.sh --build  # 重新建置後啟動
```

### 3. 查看狀態

```bash
./scripts/health.sh         # 健康檢查
./scripts/deploy.sh status  # 藍綠部署狀態
```

## 🔄 藍綠部署

### 架構說明

- **Nginx**: 反向代理，負責流量切換
- **frontend-blue**: 藍色環境（預設活躍）
- **frontend-green**: 綠色環境（備用）

### 部署指令

```bash
# 查看當前狀態
./scripts/deploy.sh status

# 自動部署到非活躍環境並切換
./scripts/deploy.sh auto

# 手動切換到指定環境
./scripts/deploy.sh blue
./scripts/deploy.sh green

# 快速回滾
./scripts/deploy.sh rollback
```

## 📦 腳本說明

| 腳本 | 用途 | 參數 |
|------|------|------|
| `start.sh` | 啟動所有服務 | `--build` 重新建置 |
| `stop.sh` | 停止所有服務 | `--clean` 清理映像檔 |
| `build.sh` | 建置映像檔 | `[service]` 指定服務 |
| `deploy.sh` | 藍綠部署控制 | `blue\|green\|status\|auto\|rollback` |
| `migrate.sh` | 執行資料庫遷移 | - |
| `logs.sh` | 查看服務日誌 | `[service] [--follow]` |
| `health.sh` | 健康狀態檢查 | - |

## 🔧 GitHub Actions CI/CD

### 工作流程

| 工作流程 | 觸發條件 | 說明 |
|----------|----------|------|
| `ci.yml` | push to any branch | 程式碼品質檢查、建置測試 |
| `deploy-prod.yml` | push to main | 部署到正式環境 |

### ⚙️ Production Secrets 設定

在 GitHub Repository 中設定以下 Secrets：

**Settings → Secrets and variables → Actions → New repository secret**

| Secret 名稱 | 說明 | 範例 |
|-------------|------|------|
| `VPS_HOST` | VPS 伺服器 IP 或域名 | `192.168.1.100` |
| `VPS_USER` | SSH 登入用戶名 | `deploy` |
| `VPS_SSH_KEY` | SSH 私鑰（完整內容） | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PROJECT_PATH` | 專案在伺服器上的路徑 | `/home/deploy/projects/portal` |
| `PROD_API_URL` | 前端呼叫的後端 API URL | `https://api.example.com` |

### 💡 SSH 私鑰共用提示

如果同一台 VPS 上有多個專案，`VPS_HOST`、`VPS_USER`、`VPS_SSH_KEY` 可以共用：
1. 在 **Organization Settings** 中設定 Organization Secrets
2. 或在每個 Repository 中設定相同的值

只有 `PROJECT_PATH` 和 `PROD_API_URL` 需要每個專案單獨設定。

### 部署策略

| 服務 | 部署方式 | 說明 |
|------|----------|------|
| **後端** | Volume 部署 | 程式碼透過 volume 掛載，重啟即更新 |
| **前端** | 藍綠部署 | 零停機時間，支援快速回滾 |

## 🏥 健康檢查

```bash
./scripts/health.sh

# 輸出範例:
# ========================================
# 服務健康狀態
# ========================================
# Backend:        ● 健康
# Frontend/Nginx: ● 健康
# Database:       ● 健康
# ========================================
```

## 📝 常用命令

```bash
# 查看服務狀態
docker compose ps

# 查看特定服務日誌
./scripts/logs.sh backend --follow

# 進入後端容器
docker exec -it portal-backend bash

# 進入資料庫
docker exec -it portal-db psql -U portal_admin -d portal_db

# 重啟特定服務
docker compose restart backend
```

## ⚠️ 注意事項

1. **請勿**將 `.env` 檔案提交到版本控制
2. 正式環境部署前請確認所有 Secrets 已正確設定
3. 首次部署需要手動初始化藍綠環境
4. 回滾操作會立即切換流量，請確認備用環境可用
