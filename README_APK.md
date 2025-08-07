# 📱 智能衣櫥 Android APK

> 基於 GitHub Actions 的自動化 APK 構建與分發系統

## 🎉 快速開始

### 📥 下載 APK

**最新版本**: [GitHub Releases](https://github.com/YOUR_REPO/releases/latest)

1. 點擊上方鏈接進入 Releases 頁面
2. 下載最新的 `.apk` 文件
3. 在 Android 設備上安裝

### 📱 系統要求

- **Android**: 8.0+ (API level 26+)
- **RAM**: 2GB+
- **存儲**: 100MB+ 可用空間

## 🚀 功能特色

- 📷 **智能拍照識別** - 調用相機直接拍攝衣物
- 🤖 **AI 自動分析** - Google Gemini AI 識別衣物屬性
- 👔 **數位衣櫃管理** - 完整的衣物管理系統
- ✨ **智能穿搭推薦** - AI 個性化搭配建議
- 📊 **穿著統計分析** - 詳細的使用數據分析
- 🧠 **ADHD 友好設計** - 專為 ADHD 用戶優化
- 🔄 **自動更新檢查** - 應用內更新提醒

## 🛠️ 開發者指南

### 設置 GitHub Actions 構建

1. **克隆倉庫**
   ```bash
   git clone https://github.com/YOUR_REPO.git
   cd smart-wardrobe-app
   ```

2. **運行自動設置**
   ```bash
   node scripts/setup-github-actions.js
   ```

3. **配置 GitHub Secrets**
   - 進入 GitHub 倉庫 Settings > Secrets and variables > Actions
   - 添加 Android 簽名相關的 secrets

4. **觸發構建**
   ```bash
   git push origin main
   ```

### 手動構建 APK

```bash
# 安裝依賴
npm install
cd client && npm install

# 構建應用
npm run build

# 設置 Capacitor
node scripts/setup-capacitor.js

# 構建 APK
cd client/android && ./gradlew assembleDebug
```

## 📋 構建流程

### 自動觸發

- **推送到 main 分支** → Debug APK
- **創建 Git 標籤** → Release APK
- **Pull Request** → 測試構建

### 手動觸發

1. 進入 GitHub Actions 頁面
2. 選擇 "Build Android APK" workflow
3. 點擊 "Run workflow"
4. 選擇構建類型並執行

## 🔐 安全特性

- ✅ **GitHub Secrets 管理** - 安全存儲簽名密鑰
- ✅ **自動安全檢查** - 構建時進行安全掃描
- ✅ **APK 簽名驗證** - 確保 APK 完整性
- ✅ **權限最小化** - 只請求必要權限

## 📊 質量保證

- 🧪 **自動化測試** - 完整的測試套件
- 🔍 **APK 驗證** - 結構和功能驗證
- 📈 **構建統計** - 詳細的構建報告
- 🛡️ **安全掃描** - 自動安全檢查

## 📖 文檔

- 📱 [APK 下載安裝指南](docs/APK_DOWNLOAD_GUIDE.md)
- 🔧 [GitHub Actions 設置指南](docs/GITHUB_ACTIONS_SETUP.md)
- ❓ [常見問題解答](docs/FAQ.md)
- 🏗️ [構建指南](docs/BUILD_GUIDE.md)

## 🔄 版本管理

### 版本號規則

使用語義化版本控制：`v主版本.次版本.修訂號`

- **主版本**：不兼容的 API 修改
- **次版本**：向下兼容的功能新增
- **修訂號**：向下兼容的問題修正

### 發布新版本

```bash
# 創建新標籤
git tag v1.0.1
git push origin v1.0.1

# 自動觸發 Release 構建
```

## 📈 統計信息

### 構建統計

```bash
# 查看構建統計
node scripts/build-statistics.js summary
```

### 下載統計

- GitHub Releases 自動統計下載次數
- 應用內可選的使用統計（需用戶同意）

## 🛠️ 工具腳本

| 腳本 | 功能 | 用法 |
|------|------|------|
| `setup-github-actions.js` | 自動設置 GitHub Actions | `node scripts/setup-github-actions.js` |
| `generate-keystore.js` | 生成 Android keystore | `node scripts/generate-keystore.js` |
| `build-apk.js` | 本地構建 APK | `node scripts/build-apk.js` |
| `test-apk.js` | 測試 APK 文件 | `node scripts/test-apk.js <apk-path>` |
| `security-check.js` | 安全檢查 | `node scripts/security-check.js` |
| `deploy-check.js` | 部署準備檢查 | `node scripts/deploy-check.js` |

## 🐛 問題報告

遇到問題？請使用我們的問題模板：

1. [APK 構建問題](.github/ISSUE_TEMPLATE/apk-build-issue.md)
2. [功能請求](https://github.com/YOUR_REPO/issues/new)
3. [Bug 報告](https://github.com/YOUR_REPO/issues/new)

## 🤝 貢獻指南

1. Fork 本倉庫
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 創建 Pull Request

## 📄 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🙏 致謝

- [Capacitor](https://capacitorjs.com/) - 跨平台應用開發框架
- [GitHub Actions](https://github.com/features/actions) - CI/CD 自動化
- [React](https://reactjs.org/) - 前端框架
- [Google Gemini AI](https://ai.google.dev/) - AI 分析服務

## 📞 聯繫我們

- 📧 Email: [your-email@example.com](mailto:your-email@example.com)
- 💬 GitHub Discussions: [討論區](https://github.com/YOUR_REPO/discussions)
- 🐛 Issues: [問題追蹤](https://github.com/YOUR_REPO/issues)

---

**立即下載體驗智能衣櫥管理！** 📱✨

[![下載 APK](https://img.shields.io/badge/下載-APK-green?style=for-the-badge&logo=android)](https://github.com/YOUR_REPO/releases/latest)
[![GitHub Stars](https://img.shields.io/github/stars/YOUR_REPO?style=for-the-badge)](https://github.com/YOUR_REPO/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/YOUR_REPO?style=for-the-badge)](https://github.com/YOUR_REPO/issues)