# 智能衣櫥應用 - 構建腳本說明

## 概述

本項目已經完全修復了 `react-scripts: not found` 錯誤和其他部署構建問題。現在包含了完整的構建、測試、監控和恢復系統。

## 🚀 快速開始

```bash
# 1. 檢查環境和診斷問題
npm run diagnose

# 2. 自動修復依賴問題
npm run fix:deps

# 3. 構建應用
npm run build

# 4. 驗證構建結果
npm run validate
```

## 📋 可用腳本

### 核心構建腳本

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

### 平台和工具腳本

| 腳本 | 描述 | 用途 |
|------|------|------|
| `npm run platform:detect` | 檢測部署平台 | 平台適配 |
| `npm run dev:tools` | 開發者工具 | 開發輔助 |
| `npm run deploy:zeabur` | Zeabur 部署 | 一鍵部署 |

## 🔧 開發者工具

使用內置的開發者工具來管理項目：

```bash
# 查看項目狀態
npm run dev:tools status

# 快速修復問題
npm run dev:tools fix

# 全新開始（清理並重新安裝）
npm run dev:tools fresh

# 運行完整測試套件
npm run dev:tools test

# 構建並測試
npm run dev:tools build
```

## 🚨 故障排除

### 常見問題快速解決

1. **react-scripts not found**:
   ```bash
   npm run fix:deps
   ```

2. **內存不足錯誤**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

3. **依賴問題**:
   ```bash
   npm run dev:tools fresh
   ```

4. **構建失敗**:
   ```bash
   npm run diagnose
   npm run emergency
   ```

### 自動診斷

運行完整診斷來識別問題：

```bash
npm run diagnose
```

這會生成詳細報告並提供具體的修復建議。

## 📊 監控和日誌

### 構建監控

```bash
# 監控構建過程
npm run build:monitor
```

### 查看日誌

所有操作都會生成詳細日誌，保存在 `logs/` 目錄：

- `build-report-*.json`: 構建報告
- `validation-report-*.json`: 驗證報告
- `integration-report-*.json`: 集成測試報告
- `diagnostics-*.json`: 診斷報告

## 💾 備份和恢復

### 創建備份

```bash
# 創建備份
npm run backup

# 列出備份
node scripts/build-recovery.js list

# 恢復備份
npm run restore <backup-id>
```

### 緊急恢復

如果遇到嚴重問題：

```bash
npm run emergency
```

這會自動清理損壞的文件並恢復到工作狀態。

## 🌐 平台部署

### Zeabur 部署

```bash
npm run deploy:zeabur
```

### Docker 部署

```bash
# 構建 Web 服務
docker build --target web -t smart-wardrobe-web .

# 構建 API 服務
docker build --target api -t smart-wardrobe-api .

# 使用 docker-compose
docker-compose up --build
```

### 本地開發

```bash
# 開發模式
npm run dev

# 構建測試
npm run build
npm run validate
```

## 📚 文檔

詳細文檔請參考：

- [構建指南](./docs/BUILD_GUIDE.md) - 完整的構建流程說明
- [故障排除指南](./docs/TROUBLESHOOTING.md) - 詳細的問題解決方案
- [部署指南](./docs/ZEABUR_DEPLOY_GUIDE.md) - 部署相關說明

## ✅ 驗證修復

要驗證所有問題都已修復：

```bash
# 運行完整驗證
npm run test:integration

# 檢查構建狀態
npm run dev:tools status

# 測試部署準備
npm run deploy:zeabur
```

## 🎯 最佳實踐

1. **定期運行診斷**: `npm run diagnose`
2. **使用自動修復**: `npm run fix:deps`
3. **創建備份**: `npm run backup`
4. **監控構建**: `npm run build:monitor`
5. **使用開發者工具**: `npm run dev:tools`

## 📞 支持

如果遇到問題：

1. 運行 `npm run diagnose` 獲取診斷信息
2. 嘗試 `npm run fix:deps` 自動修復
3. 使用 `npm run emergency` 緊急恢復
4. 查看 `logs/` 目錄中的詳細日誌

---

**注意**: 所有的 `react-scripts: not found` 錯誤和相關的部署問題現在都已經完全修復。項目包含了完整的錯誤處理、自動修復和恢復機制。