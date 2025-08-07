#!/bin/bash

# 智能衣櫃APP - Zeabur部署腳本

echo "🚀 準備部署到Zeabur..."

# 檢查Zeabur CLI是否安裝
if ! command -v zeabur &> /dev/null; then
    echo "📦 安裝Zeabur CLI..."
    
    # 根據系統安裝Zeabur CLI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install zeabur/tap/zeabur
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://zeabur.com/install.sh | bash
    else
        echo "❌ 請手動安裝Zeabur CLI: https://zeabur.com/docs/cli"
        exit 1
    fi
fi

echo "✅ Zeabur CLI已安裝"

# 檢查是否已登錄
if ! zeabur auth whoami &> /dev/null; then
    echo "🔐 請登錄Zeabur..."
    zeabur auth login
fi

echo "✅ 已登錄Zeabur"

# 檢查項目配置
if [ ! -f "zeabur.json" ]; then
    echo "❌ 未找到zeabur.json配置文件"
    exit 1
fi

# 創建.env.production文件
echo "⚙️ 創建生產環境配置..."
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5000

# 數據庫配置（Zeabur會自動注入）
MONGODB_URI=${MONGODB_URL}

# JWT密鑰（請在Zeabur控制台設置）
JWT_SECRET=${JWT_SECRET}

# AI服務API密鑰（請在Zeabur控制台設置）
GEMINI_API_KEY=${GEMINI_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# 偏好的AI服務
PREFERRED_AI_SERVICE=gemini

# 文件上傳配置
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/tmp/uploads
EOF

# 創建前端環境配置
echo "🌐 創建前端環境配置..."
cat > client/.env.production << 'EOF'
GENERATE_SOURCEMAP=false
REACT_APP_API_URL=${ZEABUR_API_URL}
REACT_APP_VERSION=1.0.0
EOF

# 運行依賴修復
echo "🔧 修復依賴問題..."
npm run fix:deps

# 更新package.json腳本
echo "📝 更新部署腳本..."
npm pkg set scripts.build="npm run install:client && npm run build:client && npm run build:server"
npm pkg set scripts.build:client="cd client && npm run build"
npm pkg set scripts.build:server="echo 'Server build complete'"
npm pkg set scripts.start="node server/index.js"

# 創建Dockerfile（如果需要）
echo "🐳 創建Dockerfile..."
cat > Dockerfile << 'EOF'
# 多階段構建
FROM node:18-alpine AS builder

# 設置工作目錄
WORKDIR /app

# 複製package文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安裝依賴
RUN npm install
RUN cd client && npm install

# 複製源代碼
COPY . .

# 構建前端
RUN cd client && npm run build

# 生產階段
FROM node:18-alpine AS production

WORKDIR /app

# 只複製必要文件
COPY package*.json ./
RUN npm ci --only=production

# 複製服務器代碼和構建的前端
COPY server/ ./server/
COPY --from=builder /app/client/build ./client/build

# 創建uploads目錄
RUN mkdir -p uploads

# 暴露端口
EXPOSE 5000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# 啟動應用
CMD ["npm", "start"]
EOF

# 創建.dockerignore
echo "📋 創建.dockerignore..."
cat > .dockerignore << 'EOF'
node_modules
client/node_modules
.git
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
uploads
logs
*.log
.DS_Store
Thumbs.db
coverage
.nyc_output
EOF

# 提交更改到Git
echo "📦 提交部署配置..."
git add .
git commit -m "🚀 添加Zeabur部署配置

- 添加zeabur.json配置文件
- 創建生產環境配置
- 添加Dockerfile和.dockerignore
- 更新package.json腳本
- 準備Zeabur部署"

# 推送到GitHub
echo "🌐 推送到GitHub..."
git push origin main

echo ""
echo "✅ Zeabur部署準備完成！"
echo ""
echo "📋 接下來的步驟："
echo "1. 訪問 https://zeabur.com"
echo "2. 登錄並創建新項目"
echo "3. 連接您的GitHub倉庫"
echo "4. 設置環境變數："
echo "   - JWT_SECRET: 您的JWT密鑰"
echo "   - GEMINI_API_KEY: Google Gemini API密鑰"
echo "   - MONGODB_PASSWORD: MongoDB密碼"
echo "5. 部署並獲取域名"
echo ""
echo "🌐 部署後您的APP將可以通過以下方式訪問："
echo "   - Web: https://您的域名.zeabur.app"
echo "   - 手機: 直接在手機瀏覽器訪問上述地址"
echo "   - PWA: 可安裝到手機桌面"
echo ""
echo "📱 手機功能完全支持："
echo "   ✓ 拍照上傳衣物"
echo "   ✓ AI自動識別"
echo "   ✓ 觸摸優化界面"
echo "   ✓ PWA離線支持"
echo ""