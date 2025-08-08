# 🧠 智能衣櫃管理APP - ADHD友好版

一個專為ADHD用戶設計的智能衣物管理系統，使用Google Gemini AI技術幫助用戶輕鬆整理衣櫃、記錄穿著、獲取專業穿搭建議。

## ✨ 功能特色

- 🤖 **Google Gemini AI識別** - 高精度衣物自動分類和分析
- 👔 **智能衣櫃管理** - 直觀的衣物瀏覽、篩選和管理
- ✨ **AI穿搭推薦** - 個性化搭配建議和風格分析
- 📊 **數據統計分析** - 穿著趨勢、利用率和智能報告
- 🧠 **ADHD友好設計** - 簡化界面、大按鈕、清晰反饋
- 🗑️ **智能淘汰建議** - AI分析幫助整理不需要的衣物
- 📱 **PWA支持** - 可安裝到桌面，離線功能
- 🔄 **跨設備同步** - 雲端存儲，隨時隨地訪問

## 🎯 ADHD友好特性

### 認知負荷優化
- **簡化模式**: 一鍵切換，只顯示核心功能
- **大按鈕設計**: 48px+按鈕，易於點擊
- **清晰視覺反饋**: 成功✅、錯誤❌、警告⚠️
- **減少選擇**: 每頁最多3個主要選項

### 快速操作
- **一鍵記錄**: 右下角快速記錄穿著
- **批量操作**: 減少重複點擊
- **3秒響應**: 所有操作快速反饋
- **智能提醒**: 適時的操作引導

## 🚀 快速開始

### 方法一：一鍵啟動（推薦）
```bash
# 克隆項目
git clone <repository-url>
cd smart-wardrobe-app

# 一鍵啟動
scripts/unix/start.sh
```

### 方法二：Docker部署
```bash
# 使用Docker Compose（新位置）
docker compose -f infra/docker/docker-compose.yml up -d

# 或使用部署腳本
./scripts/deploy.sh
```

### 訪問應用
- 🌐 **前端**: http://localhost:3000
- 🔧 **API**: http://localhost:5000
- 🏥 **健康檢查**: http://localhost:5000/health

## ⚙️ 環境配置

### 必需的環境變數
```env
# 資料庫配置
MONGODB_URI=mongodb://localhost:27017/smart-wardrobe

# JWT密鑰
JWT_SECRET=your-super-secret-jwt-key-here

# Google Gemini API (主要AI服務)
GEMINI_API_KEY=your-gemini-api-key-here

# 偏好的AI服務
PREFERRED_AI_SERVICE=gemini
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

### 3. ADHD模式
- 點擊右上角 **🧠 ADHD模式** 開關
- 界面自動簡化，只顯示核心功能
- 使用更大的按鈕和清晰的標籤

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
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登錄
- `GET /api/clothes` - 獲取衣物列表
- `POST /api/clothes/upload` - 上傳衣物圖片
- `GET /api/recommendations` - 獲取穿搭推薦
- `GET /api/clothes/statistics` - 獲取衣櫃統計

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
- **ADHD社群** - 寶貴的用戶反饋和建議
- **所有貢獻者** - 讓這個項目變得更好

---

## 🌟 如果這個項目對您有幫助，請給我們一個Star！

**讓我們一起打造更好的ADHD友好應用！** 🧠✨