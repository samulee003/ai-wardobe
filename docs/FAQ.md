# ❓ 常見問題解答 (FAQ)

## 📱 APK 下載和安裝

### Q: 如何下載最新的 APK？

**A:** 有兩種方式下載 APK：

1. **從 GitHub Releases 下載（推薦）**：
   - 訪問 [GitHub Releases 頁面](https://github.com/YOUR_REPO/releases)
   - 下載最新版本的 APK 文件

2. **從 GitHub Actions 下載**：
   - 進入 Actions 頁面
   - 選擇最新的成功構建
   - 在 Artifacts 部分下載

### Q: APK 無法安裝，提示「應用未安裝」？

**A:** 請檢查以下項目：

1. **啟用未知來源安裝**：
   - Android 8.0+：設置 > 安全性 > 安裝未知應用
   - 較舊版本：設置 > 安全性 > 未知來源

2. **檢查存儲空間**：
   - 確保有至少 100MB 可用空間

3. **重新下載 APK**：
   - APK 文件可能下載不完整

4. **檢查 Android 版本**：
   - 需要 Android 8.0 或更高版本

### Q: 安裝後應用無法打開或閃退？

**A:** 嘗試以下解決方案：

1. **重啟設備**後再試
2. **清除應用數據**：設置 > 應用管理 > 智能衣櫥 > 存儲 > 清除數據
3. **重新安裝應用**
4. **檢查權限**：確保已授予相機和存儲權限

### Q: 相機功能無法使用？

**A:** 請檢查權限設置：

1. 進入 **設置 > 應用管理 > 智能衣櫥**
2. 點擊 **權限**
3. 開啟 **相機** 和 **存儲** 權限
4. 重新啟動應用

## 🔧 GitHub Actions 構建

### Q: 構建失敗，提示 "react-scripts not found"？

**A:** 這是依賴安裝問題：

```bash
# 解決方案 1：清理並重新安裝
rm -rf node_modules client/node_modules
npm install
cd client && npm install

# 解決方案 2：檢查 package.json
# 確保 client/package.json 中包含 react-scripts
```

### Q: APK 簽名失敗？

**A:** 檢查 GitHub Secrets 設置：

1. **確保所有 Secrets 都已設置**：
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

2. **重新生成 keystore**：
   ```bash
   node scripts/generate-keystore.js
   ```

3. **檢查 Base64 編碼**：
   - 確保沒有多餘的空格或換行符

### Q: 構建超時？

**A:** 增加構建超時時間：

在 `.github/workflows/build-apk.yml` 中添加：

```yaml
jobs:
  build:
    timeout-minutes: 30  # 從默認的 6 分鐘增加到 30 分鐘
```

### Q: 如何查看詳細的構建日誌？

**A:** 在 GitHub Actions 中：

1. 進入 **Actions** 頁面
2. 點擊失敗的構建
3. 展開每個步驟查看詳細日誌
4. 查找紅色的錯誤信息

## 🔐 安全和權限

### Q: GitHub Secrets 如何設置？

**A:** 按照以下步驟：

1. 進入 GitHub 倉庫
2. 點擊 **Settings > Secrets and variables > Actions**
3. 點擊 **New repository secret**
4. 添加所需的 secrets（參考設置指南）

### Q: keystore 文件丟失了怎麼辦？

**A:** 如果 keystore 丟失：

1. **生成新的 keystore**：
   ```bash
   node scripts/generate-keystore.js
   ```

2. **更新 GitHub Secrets** 為新的 keystore 信息

3. **注意**：新 keystore 簽名的 APK 無法覆蓋安裝舊版本

### Q: 如何保護 keystore 安全？

**A:** 安全最佳實踐：

1. **不要提交 keystore 到代碼庫**
2. **定期備份 keystore**（安全存儲）
3. **使用強密碼**
4. **限制倉庫訪問權限**
5. **定期輪換密鑰**

## 📊 版本管理

### Q: 如何更新應用版本？

**A:** 有幾種方式：

1. **使用 Git 標籤（推薦）**：
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **修改 package.json**：
   ```json
   {
     "version": "1.0.1"
   }
   ```

3. **手動指定版本**：
   在 GitHub Actions 手動觸發時指定版本

### Q: 版本號規則是什麼？

**A:** 使用語義化版本控制：

- **主版本號**：不兼容的 API 修改
- **次版本號**：向下兼容的功能性新增
- **修訂號**：向下兼容的問題修正

例如：`v1.2.3`

### Q: 如何發布 beta 版本？

**A:** 創建預發布標籤：

```bash
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

這會創建一個標記為 "Pre-release" 的 GitHub Release。

## 🛠️ 開發和調試

### Q: 如何本地測試 APK 構建？

**A:** 本地構建步驟：

```bash
# 1. 安裝依賴（使用 npm ci 確保與 lockfile 一致）
npm ci
cd client && npm ci

# 2. 構建 React 應用
cd client && npm run build

# 3. 設置 Capacitor（如需）
node scripts/setup-capacitor.js

# 4. 構建 APK（需要 Android SDK）
cd client/android && ./gradlew assembleDebug
```

### Q: 如何調試 APK 問題？

**A:** 使用診斷工具：

```bash
# 運行完整診斷
node scripts/apk-error-diagnostics.js

# 測試 APK
node scripts/test-apk.js path/to/your.apk

# 查看構建統計
node scripts/build-statistics.js summary
```

### Q: 如何自定義應用配置？

**A:** 修改 `client/capacitor.config.json`：

```json
{
  "appId": "com.yourcompany.yourapp",
  "appName": "您的應用名稱",
  "webDir": "build"
}
```

## 🌐 網絡和 API

### Q: 應用無法連接網絡？

**A:** 檢查以下項目：

1. **網絡權限**：確保 APK 包含 INTERNET 權限
2. **防火牆設置**：檢查是否被防火牆阻止
3. **API 地址**：確認 API 服務器地址正確
4. **HTTPS 證書**：確保 SSL 證書有效

### Q: 如何配置 API 地址？

**A:** 在 `client/.env` 文件中設置：

```env
REACT_APP_API_URL=https://your-api-server.com
```

### Q: 離線功能如何工作？

**A:** 應用支持離線功能：

1. **數據緩存**：重要數據會緩存到本地
2. **離線瀏覽**：可以離線查看已緩存的內容
3. **同步機制**：網絡恢復時自動同步數據

## 📈 性能優化

### Q: APK 文件太大怎麼辦？

**A:** 優化 APK 大小：

```bash
# 運行構建優化
node scripts/optimize-build.js

# 檢查構建大小
node scripts/build-statistics.js summary
```

### Q: 應用運行緩慢？

**A:** 性能優化建議：

1. **清理應用數據**
2. **重啟設備**
3. **檢查可用內存**
4. **更新到最新版本**

### Q: 如何監控應用性能？

**A:** 使用內置的性能監控：

1. **查看統計頁面**：應用內的統計功能
2. **檢查錯誤日誌**：設置 > 錯誤報告
3. **性能指標**：構建報告中的性能數據

## 🔄 更新和維護

### Q: 如何檢查應用更新？

**A:** 應用會自動檢查更新：

1. **自動檢查**：每 24 小時檢查一次
2. **手動檢查**：在設置中手動檢查
3. **更新通知**：發現新版本時會顯示通知

### Q: 如何禁用自動更新檢查？

**A:** 在應用設置中：

1. 進入 **設置**
2. 找到 **自動更新檢查**
3. 關閉該選項

### Q: 數據會在更新時丟失嗎？

**A:** 正常情況下不會：

1. **數據備份**：重要數據會自動備份
2. **雲端同步**：登錄用戶的數據會同步到雲端
3. **本地存儲**：本地數據在更新時會保留

## 🆘 獲取幫助

### Q: 在哪裡報告問題？

**A:** 報告問題的渠道：

1. **GitHub Issues**：[提交新問題](https://github.com/YOUR_REPO/issues/new)
2. **使用問題模板**：選擇合適的問題類型
3. **提供詳細信息**：包含錯誤日誌和環境信息

### Q: 如何獲得技術支持？

**A:** 獲得幫助的方式：

1. **查看文檔**：閱讀完整的設置指南
2. **搜索 Issues**：查看是否有類似問題
3. **社群討論**：參與 GitHub Discussions
4. **聯繫維護者**：通過 Issues 聯繫

### Q: 如何貢獻代碼？

**A:** 貢獻流程：

1. **Fork 倉庫**
2. **創建功能分支**
3. **提交 Pull Request**
4. **參與代碼審查**

---

## 📞 還有其他問題？

如果這個 FAQ 沒有回答您的問題：

1. 🔍 **搜索現有 Issues**：[GitHub Issues](https://github.com/YOUR_REPO/issues)
2. 📝 **提交新問題**：[創建新 Issue](https://github.com/YOUR_REPO/issues/new)
3. 💬 **參與討論**：[GitHub Discussions](https://github.com/YOUR_REPO/discussions)

我們會盡快回復您的問題！ 😊