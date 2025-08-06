#!/bin/bash

# 智能衣櫃APP - GitHub自動部署腳本

echo "🚀 開始上傳到GitHub..."

# 設置GitHub倉庫URL
REPO_URL="https://github.com/samulee003/ai-wardobe.git"

# 檢查git是否安裝
if ! command -v git &> /dev/null; then
    echo "❌ Git未安裝，請先安裝Git"
    exit 1
fi

# 檢查是否已經是git倉庫
if [ ! -d ".git" ]; then
    echo "📁 初始化Git倉庫..."
    git init
    
    echo "🔗 添加遠程倉庫..."
    git remote add origin $REPO_URL
else
    echo "✅ Git倉庫已存在"
    
    # 檢查遠程倉庫是否正確
    current_remote=$(git remote get-url origin 2>/dev/null || echo "")
    if [ "$current_remote" != "$REPO_URL" ]; then
        echo "🔄 更新遠程倉庫URL..."
        git remote set-url origin $REPO_URL
    fi
fi

# 創建.gitignore文件
echo "📝 創建.gitignore文件..."
cat > .gitignore << 'EOF'
# 依賴
node_modules/
client/node_modules/

# 環境變數
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日誌
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 上傳文件
uploads/
*.jpg
*.jpeg
*.png
*.gif
*.webp

# 構建輸出
client/build/
dist/
build/

# 緩存
.cache/
.parcel-cache/

# 數據庫
data/
*.db
*.sqlite

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系統文件
.DS_Store
Thumbs.db

# Docker
.dockerignore

# 測試覆蓋率
coverage/

# 臨時文件
tmp/
temp/

# 備份文件
backups/
*.backup

# PM2
.pm2/
EOF

# 添加所有文件
echo "📦 添加文件到Git..."
git add .

# 檢查是否有變更
if git diff --staged --quiet; then
    echo "ℹ️ 沒有新的變更需要提交"
else
    # 提交變更
    echo "💾 提交變更..."
    commit_message="🎉 智能衣櫃管理APP - MVP完整版本

✨ 功能特色:
- 🤖 Google Gemini AI衣物識別
- 👔 智能衣櫃管理系統
- ✨ AI穿搭推薦引擎
- 📊 數據統計分析
- 🧠 ADHD友好界面設計
- 🗑️ 智能淘汰建議
- 📱 PWA支持和移動端優化
- 🔄 跨設備數據同步

🛠️ 技術棧:
- 前端: React 18 + Styled Components + PWA
- 後端: Node.js + Express + MongoDB
- AI服務: Google Gemini AI (主要) + 自動降級機制
- 部署: Docker + 自動化腳本

🚀 快速開始:
- 運行 ./start.sh 一鍵啟動
- 或使用 ./scripts/deploy.sh Docker部署
- 詳見 README.md 和 docs/USER_GUIDE.md

專為ADHD用戶設計的完整智能衣物管理解決方案！"

    git commit -m "$commit_message"
fi

# 推送到GitHub
echo "🌐 推送到GitHub..."
if git push -u origin main 2>/dev/null; then
    echo "✅ 成功推送到main分支"
elif git push -u origin master 2>/dev/null; then
    echo "✅ 成功推送到master分支"
else
    echo "🔄 嘗試強制推送..."
    git push -u origin main --force-with-lease 2>/dev/null || git push -u origin master --force-with-lease
fi

echo ""
echo "🎉 上傳完成！"
echo "📱 GitHub倉庫: $REPO_URL"
echo "🌐 您可以在GitHub上查看您的項目了！"
echo ""
echo "📋 後續步驟:"
echo "1. 在GitHub上設置環境變數 (Settings > Secrets)"
echo "2. 配置GitHub Actions進行自動部署"
echo "3. 設置GitHub Pages展示項目"
echo "4. 邀請協作者參與開發"
echo ""
echo "🔧 本地開發:"
echo "- 運行: ./start.sh"
echo "- 部署: ./scripts/deploy.sh"
echo "- 文檔: docs/USER_GUIDE.md"