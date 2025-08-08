# 簡化的 API Dockerfile - 避免 uploads 目錄問題
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apk add --no-cache curl

# 調試：檢查當前目錄結構
RUN echo "=== 步驟 1: 檢查初始工作目錄 ===" && \
    pwd && \
    ls -la

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 調試：檢查 package.json 複製結果
RUN echo "=== 步驟 2: 檢查 package.json 複製結果 ===" && \
    ls -la package*.json && \
    echo "package.json 內容預覽:" && \
    head -10 package.json

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 調試：檢查依賴安裝結果
RUN echo "=== 步驟 3: 檢查依賴安裝結果 ===" && \
    ls -la node_modules/ | head -10 && \
    echo "node_modules 目錄大小:" && \
    du -sh node_modules/

# 複製源代碼
COPY server/ ./server/

# 調試：檢查 server 目錄複製結果
RUN echo "=== 步驟 4: 檢查 server 目錄複製結果 ===" && \
    ls -la server/ && \
    echo "server/index.js 是否存在:" && \
    test -f server/index.js && echo "✓ 存在" || echo "✗ 不存在"

# 在運行時創建必要的目錄（而不是複製）
RUN echo "=== 步驟 5: 創建 uploads 和 logs 目錄 ===" && \
    mkdir -p logs uploads && \
    touch uploads/.gitkeep && \
    echo "目錄創建完成，檢查結果:" && \
    ls -la uploads/ logs/ && \
    echo "uploads/.gitkeep 是否存在:" && \
    test -f uploads/.gitkeep && echo "✓ 存在" || echo "✗ 不存在"

# 調試：檢查最終目錄結構
RUN echo "=== 步驟 6: 檢查最終目錄結構 ===" && \
    ls -la && \
    echo "總磁盤使用情況:" && \
    du -sh * 2>/dev/null || true

# 設置權限
RUN chown -R node:node /app

# 切換到非 root 用戶
USER node

# 暴露端口
EXPOSE 5000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# 調試：最終檢查（作為 node 用戶）
USER node
RUN echo "=== 步驟 7: 最終檢查（node 用戶權限） ===" && \
    whoami && \
    pwd && \
    ls -la && \
    echo "檢查關鍵文件權限:" && \
    ls -la server/index.js uploads/ logs/ && \
    echo "Node.js 版本:" && \
    node --version && \
    echo "npm 版本:" && \
    npm --version

# 啟動命令
CMD ["sh", "-c", "echo '=== 容器啟動時檢查 ===' && ls -la && echo '=== 啟動應用 ===' && node server/index.js"]