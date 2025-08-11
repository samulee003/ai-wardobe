# 🚀 GitHub Actions APK 構建設置指南

## 📋 概述

本指南將幫助您設置 GitHub Actions 自動構建 Android APK 的完整流程。通過這個設置，您可以：

- 🔄 自動構建 APK（推送代碼時觸發）
- 🔐 安全的 APK 簽名管理
- 📦 自動發布到 GitHub Releases
- 🧪 自動化測試和質量檢查
- 📊 構建統計和監控

## 🛠️ 前置要求

在開始之前，請確保您有：

- ✅ GitHub 倉庫（公開或私有）
- ✅ 項目已推送到 GitHub
- ✅ 本地已安裝 Node.js 16+
- ✅ 本地已安裝 Java 17+（用於生成 keystore）

## 🚀 快速設置

### 方法一：自動設置（推薦）

運行自動設置腳本：

```bash
node scripts/setup-github-actions.js
```

這個腳本會引導您完成所有設置步驟。

### 方法二：手動設置

如果您喜歡手動控制每個步驟，請按照下面的詳細指南。

## 📝 詳細設置步驟

### 步驟 1：生成 Android Keystore

首先，您需要生成用於簽名 APK 的 keystore：

```bash
node scripts/generate-keystore.js
```

這個命令會：
- 生成新的 Android keystore
- 輸出 Base64 編碼的 keystore 和相關密碼
- 自動清理本地 keystore 文件（安全考慮）

**重要**：請保存輸出的所有信息，您需要將它們添加到 GitHub Secrets。

### 步驟 2：設置 GitHub Secrets

1. **進入您的 GitHub 倉庫**
2. **點擊 Settings > Secrets and variables > Actions**
3. **點擊 "New repository secret" 添加以下 secrets：**

| Secret 名稱 | 描述 | 示例值 |
|------------|------|--------|
| `ANDROID_KEYSTORE_BASE64` | keystore 文件的 Base64 編碼 | `MIIEvgIBADANBgkqhkiG9w0BAQ...` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密碼 | `your_keystore_password` |
| `ANDROID_KEY_ALIAS` | 密鑰別名 | `smart-wardrobe-key` |
| `ANDROID_KEY_PASSWORD` | 密鑰密碼 | `your_key_password` |

### 步驟 3：驗證 Workflow 文件

確保 `.github/workflows/build-apk.yml` 文件存在且配置正確。如果不存在，請運行：

```bash
# 文件應該已經存在，如果沒有請檢查項目結構
ls -la .github/workflows/
```

### 步驟 4：配置環境變數

更新 `client/.env` 文件（如果不存在請創建）：

```env
REACT_APP_GITHUB_REPO=your-username/your-repo-name
REACT_APP_VERSION=1.0.0
```

### 步驟 5：推送代碼並測試

```bash
git add .
git commit -m "Add GitHub Actions APK build setup"
git push origin main
```

推送後，GitHub Actions 會自動開始構建。您可以在 **Actions** 標籤頁查看構建進度。

## 🎯 觸發構建的方式

### 自動觸發

- **推送到 main 分支**：自動構建 debug APK
- **創建 Git 標籤**：自動構建 release APK
- **Pull Request**：構建 debug APK 進行測試

### 手動觸發

1. 進入 GitHub 倉庫的 **Actions** 頁面
2. 選擇 **Build Android APK** workflow
3. 點擊 **Run workflow**
4. 選擇構建類型（debug 或 release）
5. 點擊 **Run workflow**

## 📦 APK 下載

### Debug APK

Debug APK 會作為 **Artifacts** 上傳：

1. 進入 **Actions** 頁面
2. 點擊對應的構建
3. 在 **Artifacts** 部分下載 APK

### Release APK

Release APK 會自動發布到 **GitHub Releases**：

1. 進入倉庫的 **Releases** 頁面
2. 找到最新版本
3. 在 **Assets** 部分下載 APK

## 🔧 自定義配置

### 修改應用信息

編輯 `client/capacitor.config.json`：

```json
{
  "appId": "com.yourcompany.yourapp",
  "appName": "您的應用名稱",
  "webDir": "build"
}
```

### 修改構建配置

編輯 `.github/workflows/build-apk.yml` 來自定義構建流程：

```yaml
# 修改 Node.js 版本
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'  # 改為您需要的版本

# 修改 Java 版本
- name: Setup Java
  uses: actions/setup-java@v4
  with:
    java-version: '17'  # 改為您需要的版本
```

### 添加環境變數

在 workflow 中添加自定義環境變數：

```yaml
env:
  CUSTOM_VAR: 'your_value'
  API_URL: 'https://your-api.com'
```

## 🧪 測試和驗證

### 本地測試

在推送前，您可以本地測試構建：

```bash
# 安裝依賴（使用 npm ci 確保與 lockfile 一致）
npm ci
cd client && npm ci

# 構建 React 應用
cd client && npm run build

# 設置 Capacitor
node scripts/setup-capacitor.js

# 構建 APK（需要 Android SDK）
cd client/android && ./gradlew assembleDebug
```

### 驗證 APK

使用測試腳本驗證生成的 APK：

```bash
node scripts/test-apk.js path/to/your/app.apk
```

### 診斷問題

如果遇到問題，運行診斷腳本：

```bash
node scripts/apk-error-diagnostics.js
```

## 📊 監控和統計

### 查看構建統計

```bash
node scripts/build-statistics.js summary
```

### 查看構建報告

構建完成後，查看生成的報告文件：

- `build-report.json` - 詳細構建報告
- `apk-test-report.json` - APK 測試報告
- `apk-diagnostics-report.json` - 診斷報告

## ❓ 常見問題

### Q: 構建失敗，提示 "react-scripts not found"

**A:** 這通常是依賴安裝問題：

```bash
# 清理並重新安裝依賴（使用 npm ci）
rm -rf node_modules client/node_modules
npm ci
cd client && npm ci
```

### Q: APK 簽名失敗

**A:** 檢查 GitHub Secrets 設置：

1. 確保所有 4 個 secrets 都已設置
2. 確保 keystore Base64 編碼正確
3. 確保密碼正確

### Q: 構建超時

**A:** 增加構建超時時間，在 workflow 中添加：

```yaml
jobs:
  build:
    timeout-minutes: 30  # 增加到 30 分鐘
```

### Q: APK 無法安裝

**A:** 檢查以下項目：

1. Android 版本是否符合要求（8.0+）
2. 是否啟用了「未知來源」安裝
3. 存儲空間是否充足
4. APK 是否完整下載

### Q: 如何更新版本號？

**A:** 有幾種方式：

1. **Git 標籤**（推薦）：
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **手動修改**：
   更新 `client/package.json` 中的 `version` 字段

### Q: 如何禁用自動構建？

**A:** 修改 workflow 觸發條件，註釋掉不需要的觸發器：

```yaml
on:
  # push:
  #   branches: [ main ]
  workflow_dispatch:  # 只保留手動觸發
```

## 🔒 安全最佳實踐

1. **保護 Secrets**
   - 不要在代碼中硬編碼敏感信息
   - 定期輪換 keystore 和密碼
   - 限制倉庫訪問權限

2. **代碼審查**
   - 對 workflow 文件的修改進行審查
   - 檢查第三方 Actions 的安全性

3. **權限控制**
   - 使用最小權限原則
   - 定期審查協作者權限

## 📞 獲取幫助

如果您遇到問題：

1. **查看文檔**
   - 閱讀 [GitHub Actions 文檔](https://docs.github.com/en/actions)
   - 查看 [Capacitor 文檔](https://capacitorjs.com/docs)

2. **運行診斷**
   ```bash
   node scripts/apk-error-diagnostics.js
   ```

3. **提交 Issue**
   - 在 GitHub Issues 中描述問題
   - 包含錯誤日誌和環境信息

4. **社群支持**
   - GitHub Discussions
   - Stack Overflow

## 🎉 完成！

恭喜！您已經成功設置了 GitHub Actions APK 構建系統。現在您可以：

- ✅ 自動構建和發布 APK
- ✅ 安全管理簽名密鑰
- ✅ 自動化測試和質量檢查
- ✅ 監控構建統計

享受自動化構建的便利吧！ 🚀