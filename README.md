# 智能衣櫃管理APP

一個智能衣物管理系統，使用 AI 技術幫助用戶輕鬆整理衣櫃、記錄穿著、獲取專業穿搭建議。

## ✨ 功能特色

- 🤖 **Google Gemini AI識別** - 高精度衣物自動分類和分析
- 👔 **智能衣櫃管理** - 直觀的衣物瀏覽、篩選和管理
- ✨ **AI穿搭推薦** - 個性化搭配建議和風格分析
- 📊 **數據統計分析** - 穿著趨勢、利用率和智能報告
 
- 🗑️ **智能淘汰建議** - AI分析幫助整理不需要的衣物
- 📱 **PWA支持** - 可安裝到桌面，離線功能
- 🔄 **跨設備同步** - 雲端存儲，隨時隨地訪問

## 🎯 主要特性
- 快速上傳與 AI 標籤
- 衣櫃管理、搜尋與統計
- AI 穿搭推薦與單件替換

## 🚀 快速開始

### 方法一：本機開發（推薦）
```bash
# 取得原始碼
git clone https://github.com/samulee003/ai-wardobe.git
cd ai-wardobe

# 安裝依賴（保留 lockfile）
npm ci

# 啟動前端與後端（同時）
npm run dev
```

提示：預設會於前端埠 3000 啟動 React、後端埠 5000 啟動 API。

Windows 注意事項：若 PowerShell 出現執行原則阻擋 npm 的錯誤，可臨時改用下列方式執行命令：
```powershell
cmd /c "npm ci"
cmd /c "npm run dev"
```

### 方法二：Docker（開發/部署）
```bash
# 使用 Docker Compose（位於 infra/docker/）
docker compose -f infra/docker/docker-compose.yml up -d

# 或使用部署腳本
./scripts/deploy.sh
```

### 訪問應用（單體模式）
- 🌐 前端: http://localhost:3000
- 🔧 API: http://localhost:5000
- 🏥 健康檢查: http://localhost:5000/health

---

## 獨立專案拆分（前後端分離部署）

你可以將本倉庫拆成兩個獨立專案：

1) 前端 `ai-wardobe-frontend/`（React + Capacitor）
- 目錄：現有 `client/` 的內容直接成為新倉庫根目錄
- 環境變數：新增 `.env`，設定
  - `REACT_APP_API_URL=https://your-api.onzeabur.app`
- 開發/打包：
  - `npm ci && npm start`
  - `npm run build`（Web）
  - `npx cap sync && npx cap build android`（APK）

2) 後端 `ai-wardobe-backend/`（Node + Express）
- 目錄：現有 `server/` 的內容直接成為新倉庫根目錄
- 需要的檔案：保留 `server/` 內 `routes/ models/ services/ index.js`，同層新增專屬 `package.json`（已存在）
- 環境變數（Zeabur/Render）：
  - `MONGODB_URI=...`（若走雲端）
  - `KIMI_API_KEY=...`（若用 Kimi）
  - `PREFERRED_AI_SERVICE=kimi|openai|gemini`
  - `PORT=5000`（或平台提供的環境變數）
- 啟動指令：`npm ci && npm run start`（或使用平台預設 Node 入口）

前端將只呼叫 `REACT_APP_API_URL` 指向的雲端 API；後端在 Zeabur 上運行，金鑰只保存在後端。

## ⚙️ 環境配置

### 必需的環境變數
```env
# 資料庫配置
MONGODB_URI=mongodb://localhost:27017/smart-wardrobe

# JWT密鑰
JWT_SECRET=your-super-secret-jwt-key-here

# AI 服務（擇一或多個）
# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
# Moonshot Kimi API
KIMI_API_KEY=your-kimi-api-key-here

# 偏好的AI服務（gemini | kimi | openai | anthropic | google-vision）
PREFERRED_AI_SERVICE=kimi
```

## 📖 使用指南

### 1. 設置AI服務
參考 [AI設置指南](AI_SETUP_GUIDE.md) 配置Google Gemini API

### 2. 開始使用
1. **註冊帳戶** - 創建您的個人衣櫃
2. **上傳衣物** - 拍照或選擇圖片，AI自動識別
3. **管理衣櫃** - 瀏覽、篩選、編輯衣物信息
4. **獲取建議** - AI推薦穿搭組合
5. **記錄穿著** - 追蹤使用情況
6. **查看統計** - 分析穿著習慣

 

詳細使用說明請查看 [用戶指南](docs/USER_GUIDE.md)

## 🛠️ 技術棧

### 前端
- **React 18** - 現代化UI框架
- **React Router** - 單頁應用路由
- **Styled Components** - CSS-in-JS樣式
- **PWA** - 漸進式Web應用

### 後端
- **Node.js + Express** - 高性能服務器
- **MongoDB + Mongoose** - NoSQL數據庫
- **JWT認證** - 安全的用戶認證
- **Multer** - 文件上傳處理

### AI服務
- **Google Gemini AI** - 主要識別服務
- **自動降級機制** - OpenAI、Anthropic備用
- **多模態分析** - 圖像+文本理解
- **個性化學習** - 用戶偏好適應

## 🔧 開發指南

### 開發命令
```bash
# 啟動開發服務器
npm run dev

# 運行測試
npm test

# 構建生產版本
npm run build
```

### API端點
- `GET /health` - 健康檢查（含 AI 服務狀態）
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登錄
- `GET /api/clothes` - 獲取衣物列表
- `POST /api/clothes/upload` - 上傳衣物圖片
- `POST /api/clothes/batch-upload` - 批量上傳衣物圖片（如已啟用）
- `GET /api/recommendations` - 獲取穿搭推薦
- `POST /api/recommendations/replace-item` - 替換穿搭中的單件
- `POST /api/clothes/search` - 自然語言搜尋（具向量/關鍵字回退）
- `GET /api/clothes/:id/similar` - 查詢相似衣物
- `GET /api/settings` / `POST /api/settings` - 系統設定（如 AI 供應商）
- `GET /api/ai-test` - 測試 AI 供應商可用性

## 🤝 貢獻指南

1. **Fork** 項目到您的GitHub
2. **創建分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **創建Pull Request**

## 📄 許可證

本項目採用 **MIT許可證** - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🆘 支持和幫助

- 📖 **文檔** - [用戶指南](docs/USER_GUIDE.md)
- 🐛 **問題報告** - [GitHub Issues](https://github.com/your-repo/issues)
- 📧 **郵件支持** - support@smartwardrobe.com

## 🙏 致謝

特別感謝：
- **Google Gemini AI** - 提供強大的AI識別服務
- **React社群** - 優秀的前端開發框架
 
- **所有貢獻者** - 讓這個項目變得更好

---

## 🌟 如果這個項目對您有幫助，請給我們一個Star！

**讓我們一起打造更好的智能衣櫃應用！** ✨