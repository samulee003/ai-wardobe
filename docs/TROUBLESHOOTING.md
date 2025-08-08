# 智能衣櫥應用故障排除指南

## 概述

本指南提供了智能衣櫥應用在構建和部署過程中常見問題的詳細解決方案。

## 快速診斷

在開始故障排除之前，請運行自動診斷工具：

```bash
npm run diagnose
```

這將生成詳細的診斷報告，幫助識別問題根源。

## 常見構建錯誤

### 1. react-scripts not found

#### 錯誤信息
```
sh: react-scripts: command not found
npm ERR! code ELIFECYCLE
```

#### 原因分析
- client 目錄的 node_modules 未安裝
- react-scripts 依賴缺失
- package.json 配置錯誤

#### 解決方案

**自動修復**:
```bash
npm run fix:deps
```

**手動修復**:
```bash
# 檢查 client 目錄
cd client
ls -la node_modules/react-scripts

# 如果不存在，重新安裝
npm install react-scripts

# 驗證安裝
npm ls react-scripts
```

**預防措施**:
```bash
# 使用完整安裝命令
npm run install:all

# 定期驗證依賴
npm run verify:deps
```

### 2. JavaScript heap out of memory

#### 錯誤信息
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

#### 原因分析
- Node.js 內存限制不足
- 構建過程消耗過多內存
- 系統可用內存不足

#### 解決方案

**增加內存限制**:
```bash
# 臨時設置（推薦）
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 或在 Windows 上
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

**使用平台特定構建**:
```bash
# 自動優化內存使用
npm run platform:build
```

**系統級優化**:
```bash
# 關閉其他應用程序
# 檢查系統內存使用
free -h  # Linux
top      # macOS/Linux
```

### 3. Module not found

#### 錯誤信息
```
Module not found: Can't resolve 'some-module'
```

#### 原因分析
- 依賴未安裝
- 版本不兼容
- 路徑錯誤

#### 解決方案

**檢查依賴**:
```bash
# 檢查缺失的依賴
npm ls --depth=0
cd client && npm ls --depth=0

# 安裝缺失的依賴
npm install <missing-module>
cd client && npm install <missing-module>
```

**清理重裝**:
```bash
# 清理所有依賴
rm -rf node_modules client/node_modules
rm package-lock.json client/package-lock.json

# 重新安裝
npm run install:all
```

### 4. Permission denied (EACCES)

#### 錯誤信息
```
npm ERR! code EACCES
npm ERR! errno -13
npm ERR! Error: EACCES: permission denied
```

#### 原因分析
- 文件權限問題
- npm 全局安裝權限
- 目錄訪問權限

#### 解決方案

**修復文件權限**:
```bash
# Linux/macOS
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules

# 或使用 npm 權限修復
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

**Windows 解決方案**:
```cmd
# 以管理員身份運行命令提示符
npm cache clean --force
npm install
```

### 5. Build timeout

#### 錯誤信息
```
Build timed out after 600 seconds
```

#### 原因分析
- 構建過程過慢
- 網絡連接問題
- 資源限制

#### 解決方案

**使用監控構建**:
```bash
npm run build:monitor
```

**優化構建過程**:
```bash
# 使用生產模式
NODE_ENV=production npm run build

# 禁用源映射
GENERATE_SOURCEMAP=false npm run build
```

**分步構建**:
```bash
# 分別安裝和構建
npm run install:all
npm run build:client
```

## 平台特定問題

### Zeabur 部署問題

#### 問題: 構建在 Zeabur 上失敗

**解決方案**:
```bash
# 使用 Zeabur 優化構建
npm run build:zeabur

# 檢查 Zeabur 特定配置
cat infra/zeabur/zeabur.json
```

**環境變數設置**:
```bash
NODE_OPTIONS=--max-old-space-size=1024
GENERATE_SOURCEMAP=false
CI=false
```

### Docker 構建問題

#### 問題: Docker 構建失敗

**解決方案**:
```bash
# 檢查 Dockerfile
docker build --no-cache -t smart-wardrobe .

# 使用多階段構建
docker build --target web -t smart-wardrobe-web .
```

**常見 Docker 問題**:
```dockerfile
# 確保正確的工作目錄
WORKDIR /app

# 正確的文件複製順序
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci
```

### CI/CD 環境問題

#### 問題: CI 環境構建失敗

**解決方案**:
```bash
# 設置 CI 環境變數
export CI=true
export NODE_OPTIONS="--max-old-space-size=4096"

# 使用 CI 特定構建
npm run platform:build
```

## 依賴問題

### 版本衝突

#### 問題識別
```bash
npm ls
# 查找 UNMET DEPENDENCY 或版本衝突
```

#### 解決方案
```bash
# 自動解決版本衝突
npm run fix:deps

# 手動解決
npm install <package>@<specific-version>
```

### 依賴缺失

#### 檢查方法
```bash
npm run verify:deps
```

#### 修復方法
```bash
# 自動修復
npm run fix:deps

# 手動安裝
npm install
cd client && npm install
```

## 性能問題

### 構建速度慢

#### 優化方案
```bash
# 使用 npm ci 而不是 npm install
npm ci
cd client && npm ci

# 啟用並行構建
npm run platform:build
```

#### 緩存優化
```bash
# 清理 npm 緩存
npm cache clean --force

# 驗證緩存
npm cache verify
```

### 內存使用過高

#### 監控內存使用
```bash
# 使用構建監控
npm run build:monitor

# 檢查系統資源
htop  # Linux
Activity Monitor  # macOS
Task Manager  # Windows
```

#### 優化內存使用
```bash
# 設置內存限制
export NODE_OPTIONS="--max-old-space-size=2048"

# 使用生產模式
NODE_ENV=production npm run build
```

## 網絡問題

### npm 安裝超時

#### 解決方案
```bash
# 增加超時時間
npm config set timeout 60000

# 使用不同的 registry
npm config set registry https://registry.npmmirror.com/

# 重置為默認 registry
npm config set registry https://registry.npmjs.org/
```

### 代理設置

#### 配置代理
```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### 清除代理
```bash
npm config delete proxy
npm config delete https-proxy
```

## 恢復和備份

### 創建備份

```bash
# 創建當前狀態備份
npm run backup

# 創建帶標籤的備份
npm run backup production-ready
```

### 恢復操作

```bash
# 列出可用備份
npm run backup list

# 恢復特定備份
npm run restore <backup-id>

# 緊急恢復
npm run emergency
```

### 完全重置

```bash
# 清理所有構建文件
rm -rf node_modules client/node_modules client/build
rm package-lock.json client/package-lock.json

# 重新開始
npm run install:all
npm run build
```

## 日誌和調試

### 查看詳細日誌

```bash
# 構建日誌
cat logs/latest-build-report.json

# 診斷日誌
cat logs/diagnostics-*.json

# 集成測試日誌
cat logs/integration-report-*.json
```

### 啟用調試模式

```bash
# 詳細輸出
npm run build --verbose

# 調試模式
DEBUG=* npm run build
```

## 預防措施

### 定期維護

```bash
# 每週運行
npm run diagnose
npm run verify:deps

# 每月運行
npm run test:integration
npm run backup cleanup
```

### 監控腳本

```bash
# 設置定期檢查
crontab -e
# 添加: 0 2 * * * cd /path/to/project && npm run diagnose
```

### 最佳實踐

1. **始終使用 `npm run install:all`** 而不是單獨的 `npm install`
2. **定期運行 `npm run verify:deps`** 檢查依賴完整性
3. **在重要更改前創建備份** `npm run backup`
4. **使用平台特定構建** `npm run platform:build`
5. **監控構建過程** `npm run build:monitor`

## 獲取幫助

如果以上解決方案都無法解決問題：

1. **收集診斷信息**:
   ```bash
   npm run diagnose > diagnosis.txt
   ```

2. **檢查日誌文件**:
   ```bash
   ls -la logs/
   ```

3. **運行完整測試**:
   ```bash
   npm run test:integration
   ```

4. **嘗試緊急恢復**:
   ```bash
   npm run emergency
   ```

記住，大多數構建問題都可以通過 `npm run fix:deps` 和 `npm run emergency` 自動解決。