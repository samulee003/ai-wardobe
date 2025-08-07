# 🚀 Zeabur部署指南 - 智能衣櫃管理APP

## 🌟 為什麼選擇Zeabur？

Zeabur是一個現代化的雲端部署平台，特別適合您的智能衣櫃APP：

### ✅ 完美支持您的技術棧
- **React前端** - 自動構建和CDN分發
- **Node.js後端** - 無服務器自動擴展
- **MongoDB數據庫** - 託管數據庫服務
- **文件上傳** - 支持圖片存儲

### ✅ 手機友好特性
- **自動HTTPS** - 手機瀏覽器安全訪問
- **全球CDN** - 快速載入速度
- **PWA支持** - 可安裝到手機桌面
- **響應式** - 完美適配各種設備

### ✅ 開發者友好
- **Git自動部署** - 推送代碼自動更新
- **環境變數管理** - 安全存儲API密鑰
- **實時日誌** - 方便調試和監控
- **免費額度** - 個人項目免費使用

## 📋 部署前準備

### 1. 確保代碼已推送到GitHub
```bash
# 運行自動Git腳本
./autogit.bat

# 或手動推送
git add .
git commit -m "準備Zeabur部署"
git push origin main
```

### 2. 準備API密鑰
- **Google Gemini API密鑰** - 用於AI識別
- **JWT密鑰** - 用於用戶認證（可自動生成）
- **MongoDB密碼** - 數據庫密碼（可自動生成）

## 🚀 一鍵部署步驟

### 步驟1：運行部署腳本
```bash
# Windows用戶
deploy-zeabur.bat

# Linux/Mac用戶
./scripts/deploy-zeabur.sh
```

### 步驟2：訪問Zeabur控制台
1. 打開 [https://zeabur.com](https://zeabur.com)
2. 使用GitHub帳戶登錄
3. 點擊「Create Project」

### 步驟3：導入GitHub倉庫
1. 選擇「Import from GitHub」
2. 選擇您的倉庫：`ai-wardobe`
3. 確認導入

### 步驟4：配置服務
Zeabur會自動檢測並配置：

#### 🔧 後端API服務
- **類型**: Node.js
- **端口**: 5000
- **健康檢查**: `/health`
- **自動擴展**: 是

#### 🌐 前端Web服務
- **類型**: Static Site (React)
- **構建命令**: `npm run build`
- **輸出目錄**: `build`
- **SPA路由**: 支持

#### 🗄️ MongoDB數據庫
- **版本**: 6.0
- **存儲**: 1GB
- **自動備份**: 是

### 步驟5：設置環境變數

#### 後端服務環境變數：
```env
JWT_SECRET=your-jwt-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
PREFERRED_AI_SERVICE=gemini
NODE_ENV=production
```

#### 前端服務環境變數：
```env
REACT_APP_API_URL=https://api-your-project.zeabur.app
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

### 步驟6：部署應用
1. 點擊「Deploy」按鈕
2. 等待構建完成（約3-5分鐘）
3. 獲取自動生成的域名

## 🌐 部署後訪問

### Web訪問
- **主應用**: `https://your-project.zeabur.app`
- **API端點**: `https://api-your-project.zeabur.app`

### 📱 手機訪問
1. **直接瀏覽器訪問**：
   - 在手機瀏覽器輸入域名
   - 允許相機權限
   - 開始拍照上傳衣物

2. **安裝為PWA**：
   - iPhone: Safari → 分享 → 加入主畫面
   - Android: Chrome → 選單 → 安裝應用程式

## 🎯 部署後功能測試

### ✅ 基本功能測試
- [ ] 用戶註冊/登錄
- [ ] 拍照上傳衣物
- [ ] AI自動識別
- [ ] 衣櫃管理
- [ ] 穿搭推薦
- [ ] 統計分析

### ✅ 手機功能測試
- [ ] 手機瀏覽器訪問
- [ ] 相機權限獲取
- [ ] 拍照功能正常
- [ ] 觸摸操作流暢
- [ ] PWA安裝功能
- [ ] 離線緩存功能

### ✅ AI功能測試
- [ ] Gemini API連接正常
- [ ] 衣物識別準確
- [ ] 信心度顯示
- [ ] 重新分析功能
- [ ] 穿搭推薦生成

## 🔧 部署後配置

### 自定義域名（可選）
1. 在Zeabur控制台點擊「Domains」
2. 添加您的自定義域名
3. 配置DNS記錄
4. 自動獲得SSL證書

### 環境變數更新
1. 在控制台選擇對應服務
2. 點擊「Environment Variables」
3. 添加或修改變數
4. 服務會自動重啟

### 監控和日誌
1. **實時日誌**: 控制台「Logs」標籤
2. **性能監控**: 「Metrics」標籤
3. **錯誤追蹤**: 「Events」標籤

## 📊 資源使用和費用

### 免費額度（足夠個人使用）
- **計算時間**: 每月100小時
- **帶寬**: 每月100GB
- **存儲**: 1GB數據庫
- **域名**: 免費.zeabur.app子域名

### 付費升級（如需要）
- **Pro計劃**: $5/月起
- **更多計算資源**
- **自定義域名**
- **高級監控**

## 🔄 自動部署設置

### Git自動部署
1. 每次推送到main分支
2. Zeabur自動檢測變更
3. 自動構建和部署
4. 零停機時間更新

### 部署通知
1. 在控制台設置Webhook
2. 可發送到Slack、Discord等
3. 部署成功/失敗通知

## 🆘 常見問題解決

### Q: 部署失敗怎麼辦？
A: 
1. 檢查構建日誌
2. 確認環境變數設置
3. 檢查package.json配置
4. 聯繫Zeabur支持

### Q: API無法連接？
A: 
1. 檢查後端服務狀態
2. 確認環境變數正確
3. 檢查健康檢查端點
4. 查看服務日誌

### Q: 手機無法拍照？
A: 
1. 確認HTTPS訪問
2. 檢查瀏覽器權限
3. 測試不同瀏覽器
4. 檢查前端構建

### Q: AI識別不工作？
A: 
1. 確認Gemini API密鑰
2. 檢查API配額
3. 查看後端日誌
4. 測試API連接

## 🎉 部署成功！

恭喜！您的智能衣櫃管理APP現在已經：

### ✅ 全球可訪問
- 任何人都可以通過域名訪問
- 自動HTTPS安全連接
- 全球CDN加速

### ✅ 手機完美支持
- 📱 手機瀏覽器直接使用
- 📷 相機拍照上傳功能
- 🤖 AI實時識別分析
- 💾 可安裝為PWA應用

### ✅ 生產級穩定
- 🔄 自動擴展和恢復
- 📊 實時監控和日誌
- 🔒 安全的環境變數管理
- 🚀 Git自動部署

## 📞 技術支持

- **Zeabur文檔**: https://zeabur.com/docs
- **Zeabur社群**: https://discord.gg/zeabur
- **項目文檔**: docs/USER_GUIDE.md
- **手機指南**: docs/MOBILE_GUIDE.md

---

**🎊 您的智能衣櫃管理APP現在已經在雲端運行，全世界的用戶都可以在手機上使用了！**