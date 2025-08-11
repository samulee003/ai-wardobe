# 📱 智能衣櫥 Android APK（導引）

此文件已精簡為導引頁。完整且最新的 APK 構建說明請閱讀：

- 🏗️ 單一來源構建指南：`docs/APK_BUILD_GUIDE.md`
- 📥 下載與安裝：`docs/APK_DOWNLOAD_GUIDE.md`
- ⚙️ GitHub Actions 設置：`docs/GITHUB_ACTIONS_SETUP.md`

關鍵原則（重要）：
- 使用 `npm ci` 安裝依賴（根與 `client/`），保留兩個 `package-lock.json` 以確保可重現性。
- Debug APK 可於 CI 的 Artifacts 下載；Release APK 於 Releases 頁面下載。

若您先前依賴此文件中的詳細教學，請改查閱上述單一來源文檔。