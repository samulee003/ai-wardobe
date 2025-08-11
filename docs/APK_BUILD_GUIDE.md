# 智能衣櫥 Android APK 構建指南（單一來源）

本文件為 APK 構建的唯一權威文檔，涵蓋「CI 自動構建」與「本地構建」兩條路徑。下載安裝請參考 `docs/APK_DOWNLOAD_GUIDE.md`，GitHub Actions 設置請參考 `docs/GITHUB_ACTIONS_SETUP.md`。

## 🚀 路徑一：CI 自動構建（推薦）

適合團隊與穩定輸出 APK 的情境。

1) 參考 `docs/GITHUB_ACTIONS_SETUP.md` 完成工作流與簽名（Release 可選）設置。
2) 推送到 main 會自動產生 Debug APK（Artifacts）。打 Tag 會自動產生 Release APK（Releases）。
3) 下載位置：
- Debug：GitHub Actions 對應工作流 → Artifacts
- Release：Releases 頁面 → Assets

備註：工作流採用 Node/Java 安裝與 Gradle assemble，且依賴安裝一律使用 `npm ci`（根與 `client/`），以確保 lockfile 一致性與可重現性。

## 🧰 路徑二：本地構建 APK

### 方法一：Windows 一鍵腳本（推薦）

```bat
scripts\windows\build-debug-apk.bat
```

產物路徑：`client\android\app\build\outputs\apk\debug\app-debug.apk`

### 方法二：手動構建（跨平台）

1) 安裝依賴（務必保留 lockfile 並使用 `npm ci`）

```bash
# 在專案根目錄
npm ci

# 安裝前端依賴
cd client && npm ci
```

2) 構建 React 前端

```bash
cd client
npm run build
```

3) 同步到 Android（Capacitor）

```bash
npx cap sync android
```

4) 使用 Gradle 構建 Debug APK

```bash
cd android
# macOS/Linux
./gradlew assembleDebug
# Windows（PowerShell/CMD）
gradlew.bat assembleDebug
```

完成後 APK 位於：`client/android/app/build/outputs/apk/debug/app-debug.apk`

## 🔐 Release 簽名（可選）

如需正式簽名與發布，請於 CI 中配置以下 Secrets，並使用 Release 工作流：

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

詳見 `docs/GITHUB_ACTIONS_SETUP.md`。

## 📋 系統需求

- Node.js 16+、npm 8+
- Android Studio 與 SDK、Java 17（CI 亦採用）
- 足夠的磁碟空間（> 3GB）

## ❓ 常見問題（FAQ）

### Q1: 構建時出現 react-scripts not found？
- 使用 `npm ci` 重新安裝依賴（根與 `client/`），避免鎖檔不一致：
```bash
rm -rf node_modules client/node_modules
npm ci && cd client && npm ci
```

### Q2: CI 提示 lockfile 缺失或依賴不一致？
- 確保根與 `client/` 的 `package-lock.json` 都已提交並保留，並在 CI 中使用 `npm ci` 安裝。

### Q3: APK 無法安裝？
- Android 需啟用「安裝未知應用」。
- 確認裝置 Android 版本與儲存空間足夠。

### Q4: 如何加速或診斷構建？
- 本地可先 `cd client && npm run build` 驗證前端無誤。
- 於 CI 上檢視工作流日誌；使用 `scripts/apk-error-diagnostics.js` 輔助診斷。

---

以上流程已在本專案 CI 與本地開發中實測通過；若仍有疑問，請提交 Issue 並附上日誌。


