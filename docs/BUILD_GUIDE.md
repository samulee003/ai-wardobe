# 智能衣櫥應用構建指南

## 概述

本指南提供了智能衣櫥應用的完整構建流程，包括本地開發、測試和部署到各種平台的詳細說明。

## 系統要求

- **Node.js**: 16.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **操作系統**: Windows, macOS, Linux
- **內存**: 至少 4GB RAM（推薦 8GB）
- **磁盤空間**: 至少 2GB 可用空間

## 快速開始

### 1. 環境檢查

```bash
# 檢查 Node.js 版本
node --version

# 檢查 npm 版本
npm --version

# 運行環境診斷
npm run diagnose
```

### 2. 安裝依賴

```bash
# 安裝所有依賴（根目錄和客戶端）
npm run install:all

# 或者分別安裝
npm install
cd client && npm install
```

### 3. 驗證依賴

```bash
# 驗證所有依賴是否正確安裝
npm run verify:deps

# 如果有問題，自動修復依賴
npm run fix:deps
```

### 4. 構建應用

```bash
# 完整構建
npm run build

# 僅構建客戶端
npm run build:client

# 平台特定構建
npm run platform:build
```

## 詳細構建流程

### 構建腳本說明

| 腳本 | 描述 | 用途 |
|------|------|------|
| `npm run build` | 完整構建流程 | 生產部署 |
| `npm run build:client` | 僅構建前端 | 前端開發 |
| `npm run build:zeabur` | Zeabur 優化構建 | Zeabur 部署 |
| `npm run platform:build` | 平台自適應構建 | 多平台部署 |

### 依賴管理腳本

| 腳本 | 描述 | 用途 |
|------|------|------|
| `npm run install:all` | 安裝所有依賴 | 初始設置 |
| `npm run install:client` | 安裝客戶端依賴 | 客戶端開發 |
| `npm run verify:deps` | 驗證依賴完整性 | 故障排除 |
| `npm run fix:deps` | 自動修復依賴問題 | 故障修復 |

### 測試和驗證腳本

| 腳本 | 描述 | 用途 |
|------|------|------|
| `npm run validate` | 構建驗證 | 質量保證 |
| `npm run test:build` | 構建功能測試 | 自動化測試 |
| `npm run test:integration` | 集成測試 | 完整流程測試 |
| `npm run diagnose` | 錯誤診斷 | 問題分析 |

### 監控和恢復腳本

| 腳本 | 描述 | 用途 |
|------|------|------|
| `npm run build:monitor` | 構建過程監控 | 性能分析 |
| `npm run backup` | 創建構建備份 | 數據保護 |
| `npm run restore` | 恢復構建狀態 | 故障恢復 |
| `npm run emergency` | 緊急恢復 | 災難恢復 |

## 平台特定構建

### 本地開發

```bash
# 開發環境構建
npm run build

# 啟動開發服務器
npm run dev
```

### Zeabur 部署

```bash
# Zeabur 優化構建
npm run build:zeabur

# 或使用部署腳本
npm run deploy:zeabur
```

### Docker 部署

```bash
# 構建 Docker 映像
docker build -t smart-wardrobe-web --target web .
docker build -t smart-wardrobe-api --target api .

# 或使用 docker-compose
docker-compose up --build
```

### CI/CD 環境

```bash
# 設置 CI 環境變數
export CI=true
export NODE_OPTIONS="--max-old-space-size=4096"

# 運行完整測試套件
npm run test:integration
```

## 故障排除

### 常見問題

#### 1. react-scripts not found

**症狀**: 構建時出現 "react-scripts: not found" 錯誤

**解決方案**:
```bash
# 自動修復
npm run fix:deps

# 手動修復
cd client
npm install react-scripts
```

#### 2. 內存不足錯誤

**症狀**: "JavaScript heap out of memory" 錯誤

**解決方案**:
```bash
# 增加 Node.js 內存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 3. 依賴版本衝突

**症狀**: 依賴安裝或構建失敗

**解決方案**:
```bash
# 清理並重新安裝
rm -rf node_modules client/node_modules
npm run install:all
```

#### 4. 構建超時

**症狀**: 構建過程超時

**解決方案**:
```bash
# 使用監控構建
npm run build:monitor

# 或使用平台特定構建
npm run platform:build
```

### 診斷工具

#### 環境診斷

```bash
# 完整環境診斷
npm run diagnose

# 檢查平台配置
npm run platform:detect
```

#### 構建驗證

```bash
# 驗證構建配置
npm run validate

# 測試構建功能
npm run test:build
```

#### 性能分析

```bash
# 監控構建過程
npm run build:monitor

# 運行性能基準測試
npm run test:integration
```

## 最佳實踐

### 開發環境

1. **定期更新依賴**
   ```bash
   npm run fix:deps
   npm run verify:deps
   ```

2. **使用構建驗證**
   ```bash
   npm run validate
   ```

3. **創建定期備份**
   ```bash
   npm run backup
   ```

### 生產部署

1. **使用平台特定構建**
   ```bash
   npm run platform:build
   ```

2. **運行完整測試**
   ```bash
   npm run test:integration
   ```

3. **監控構建過程**
   ```bash
   npm run build:monitor
   ```

### 性能優化

1. **啟用構建緩存**
   - Docker 多階段構建
   - npm 緩存優化

2. **內存管理**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

3. **並行構建**
   - 使用 CI 環境的並行功能
   - 分離前端和後端構建

## 環境變數配置

### 開發環境

```bash
NODE_ENV=development
GENERATE_SOURCEMAP=true
```

### 生產環境

```bash
NODE_ENV=production
GENERATE_SOURCEMAP=false
CI=false
```

### 平台特定

#### Zeabur
```bash
NODE_OPTIONS="--max-old-space-size=1024"
GENERATE_SOURCEMAP=false
CI=false
```

#### Docker
```bash
NODE_OPTIONS="--max-old-space-size=2048"
GENERATE_SOURCEMAP=false
```

## 監控和日誌

### 構建日誌

構建過程會生成詳細日誌，保存在 `logs/` 目錄：

- `build-report-*.json`: 構建報告
- `validation-report-*.json`: 驗證報告
- `integration-report-*.json`: 集成測試報告
- `diagnostics-*.json`: 診斷報告

### 備份管理

備份文件保存在 `.build-backups/` 目錄：

```bash
# 列出所有備份
npm run backup list

# 恢復特定備份
npm run restore <backup-id>

# 清理舊備份
npm run backup cleanup
```

## 支持和幫助

如果遇到問題，請按以下順序嘗試：

1. 運行診斷工具: `npm run diagnose`
2. 查看構建日誌: `logs/latest-build-report.json`
3. 嘗試自動修復: `npm run fix:deps`
4. 使用緊急恢復: `npm run emergency`

更多詳細信息，請參考：
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [故障排除指南](./TROUBLESHOOTING.md)
- [API 文檔](./API_GUIDE.md)