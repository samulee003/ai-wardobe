#!/bin/bash

# 智能衣櫃APP - 快速啟動腳本

echo "🚀 啟動智能衣櫃管理APP..."

# 檢查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安裝，請先安裝Node.js"
    exit 1
fi

# 檢查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安裝，請先安裝npm"
    exit 1
fi

# 檢查MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️ MongoDB未安裝，將使用Docker運行"
fi

# 安裝依賴
echo "📦 安裝後端依賴..."
npm install

echo "📦 安裝前端依賴..."
cd client && npm install && cd ..

# 檢查環境變數
if [ ! -f .env ]; then
    echo "📝 創建環境變數文件..."
    cp .env.example .env
    echo "⚠️ 請編輯 .env 文件設置您的API密鑰"
fi

# 創建必要目錄
mkdir -p uploads logs

# 啟動MongoDB (如果需要)
if ! pgrep -x "mongod" > /dev/null; then
    echo "🗄️ 啟動MongoDB..."
    if command -v mongod &> /dev/null; then
        mongod --dbpath ./data/db --fork --logpath ./logs/mongodb.log
    else
        echo "🐳 使用Docker啟動MongoDB..."
        docker run -d --name mongodb -p 27017:27017 -v $(pwd)/data/db:/data/db mongo:latest
    fi
fi

# 啟動後端服務
echo "🔧 啟動後端服務..."
npm run dev &
BACKEND_PID=$!

# 等待後端啟動
sleep 5

# 啟動前端服務
echo "🌐 啟動前端服務..."
cd client && npm start &
FRONTEND_PID=$!

echo "✅ 服務啟動完成！"
echo ""
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 後端地址: http://localhost:5000"
echo "🏥 健康檢查: http://localhost:5000/health"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
trap "echo '🛑 停止服務...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait