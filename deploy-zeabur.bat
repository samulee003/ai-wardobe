@echo off
chcp 65001 >nul
title 智能衣櫃APP - Zeabur部署

echo.
echo ==========================================
echo    🚀 智能衣櫃APP - Zeabur部署工具
echo ==========================================
echo.

:: 檢查Git是否安裝
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git未安裝，請先安裝Git
    pause
    exit /b 1
)

echo ✅ Git已安裝

:: 創建生產環境配置
echo.
echo ⚙️ 創建生產環境配置...

echo NODE_ENV=production > .env.production
echo PORT=5000 >> .env.production
echo. >> .env.production
echo # 數據庫配置（Zeabur會自動注入） >> .env.production
echo MONGODB_URI=${MONGODB_URL} >> .env.production
echo. >> .env.production
echo # JWT密鑰（請在Zeabur控制台設置） >> .env.production
echo JWT_SECRET=${JWT_SECRET} >> .env.production
echo. >> .env.production
echo # AI服務API密鑰（請在Zeabur控制台設置） >> .env.production
echo GEMINI_API_KEY=${GEMINI_API_KEY} >> .env.production
echo OPENAI_API_KEY=${OPENAI_API_KEY} >> .env.production
echo ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} >> .env.production
echo. >> .env.production
echo # 偏好的AI服務 >> .env.production
echo PREFERRED_AI_SERVICE=gemini >> .env.production

:: 創建前端生產環境配置
echo 🌐 創建前端環境配置...
echo GENERATE_SOURCEMAP=false > client\.env.production
echo REACT_APP_API_URL=${ZEABUR_API_URL} >> client\.env.production
echo REACT_APP_VERSION=1.0.0 >> client\.env.production

:: 創建Dockerfile
echo 🐳 創建Dockerfile...
(
echo # 多階段構建
echo FROM node:18-alpine AS builder
echo.
echo # 設置工作目錄
echo WORKDIR /app
echo.
echo # 複製package文件
echo COPY package*.json ./
echo COPY client/package*.json ./client/
echo.
echo # 安裝依賴
echo RUN npm install
echo RUN cd client ^&^& npm install
echo.
echo # 複製源代碼
echo COPY . .
echo.
echo # 構建前端
echo RUN cd client ^&^& npm run build
echo.
echo # 生產階段
echo FROM node:18-alpine AS production
echo.
echo WORKDIR /app
echo.
echo # 只複製必要文件
echo COPY package*.json ./
echo RUN npm ci --only=production
echo.
echo # 複製服務器代碼和構建的前端
echo COPY server/ ./server/
echo COPY --from=builder /app/client/build ./client/build
echo.
echo # 創建uploads目錄
echo RUN mkdir -p uploads
echo.
echo # 暴露端口
echo EXPOSE 5000
echo.
echo # 健康檢查
echo HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
echo   CMD curl -f http://localhost:5000/health ^|^| exit 1
echo.
echo # 啟動應用
echo CMD ["npm", "start"]
) > Dockerfile

:: 創建.dockerignore
echo 📋 創建.dockerignore...
(
echo node_modules
echo client/node_modules
echo .git
echo .env
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo uploads
echo logs
echo *.log
echo .DS_Store
echo Thumbs.db
echo coverage
echo .nyc_output
) > .dockerignore

:: 更新package.json
echo 📝 更新package.json腳本...
npm pkg set scripts.build="npm run build:client && npm run build:server"
npm pkg set scripts.build:client="cd client && npm run build"
npm pkg set scripts.build:server="echo Server build complete"
npm pkg set scripts.start="node server/index.js"

:: 提交到Git
echo.
echo 📦 提交部署配置到Git...
git add .
git commit -m "🚀 添加Zeabur部署配置

- 添加zeabur.json配置文件
- 創建生產環境配置
- 添加Dockerfile和.dockerignore
- 更新package.json腳本
- 準備Zeabur部署"

:: 推送到GitHub
echo 🌐 推送到GitHub...
git push origin main

if errorlevel 1 (
    echo ⚠️ 推送失敗，請檢查GitHub連接
    echo 您可以稍後手動推送：git push origin main
)

echo.
echo ✅ Zeabur部署準備完成！
echo.
echo ==========================================
echo           📋 部署步驟指南
echo ==========================================
echo.
echo 1. 📱 訪問 Zeabur 控制台
echo    https://zeabur.com
echo.
echo 2. 🔐 登錄並創建新項目
echo    - 點擊 "Create Project"
echo    - 選擇 "Import from GitHub"
echo    - 選擇您的倉庫: ai-wardobe
echo.
echo 3. ⚙️ 配置服務
echo    Zeabur會自動檢測到：
echo    ✓ Node.js 後端服務
echo    ✓ React 前端應用
echo    ✓ MongoDB 數據庫
echo.
echo 4. 🔑 設置環境變數
echo    在Zeabur控制台設置以下變數：
echo.
echo    後端服務環境變數：
echo    - JWT_SECRET: 您的JWT密鑰
echo    - GEMINI_API_KEY: Google Gemini API密鑰
echo    - MONGODB_PASSWORD: MongoDB密碼
echo    - PREFERRED_AI_SERVICE: gemini
echo.
echo    前端服務環境變數：
echo    - REACT_APP_API_URL: 後端服務URL（自動生成）
echo.
echo 5. 🚀 部署應用
echo    - 點擊 "Deploy" 按鈕
echo    - 等待構建完成（約3-5分鐘）
echo    - 獲取自動生成的域名
echo.
echo 6. 🌐 訪問您的APP
echo    - Web: https://您的域名.zeabur.app
echo    - 手機: 直接在手機瀏覽器訪問
echo    - PWA: 可安裝到手機桌面
echo.
echo ==========================================
echo           📱 手機功能支持
echo ==========================================
echo.
echo ✅ 完全支持手機使用：
echo    📷 拍照上傳衣物
echo    🤖 AI自動識別分析
echo    👔 智能衣櫃管理
echo    ✨ AI穿搭推薦
echo    📊 數據統計分析
echo    🗑️ 智能淘汰建議
echo    🧠 ADHD友好界面
echo    🔄 PWA離線支持
echo.
echo ==========================================
echo           🎯 部署優勢
echo ==========================================
echo.
echo 🌟 Zeabur部署優勢：
echo    ✓ 自動HTTPS證書
echo    ✓ 全球CDN加速
echo    ✓ 自動擴展
echo    ✓ 免費額度
echo    ✓ Git自動部署
echo    ✓ 環境變數管理
echo    ✓ 監控和日誌
echo.
echo 📖 詳細文檔：
echo    - Zeabur文檔: https://zeabur.com/docs
echo    - 項目文檔: docs/USER_GUIDE.md
echo    - 手機指南: docs/MOBILE_GUIDE.md
echo.
echo 🎉 準備就緒！請按照上述步驟在Zeabur上部署您的APP
echo.
pause