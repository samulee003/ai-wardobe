# 統一 Dockerfile - 支持多階段構建
# 用於同時構建前端和後端

# 基礎階段
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache git curl

# 依賴安裝階段
FROM base AS dependencies

# 複製所有 package.json 文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY scripts/ ./scripts/

# 安裝根目錄依賴
RUN npm ci --only=production

# 安裝 client 依賴
WORKDIR /app/client
RUN npm ci --only=production

# 前端構建階段
FROM dependencies AS frontend-builder
WORKDIR /app

# 複製前端源代碼
COPY client/ ./client/

# 構建前端
WORKDIR /app/client
RUN npm run build

# 驗證構建結果
RUN ls -la build/ && \
    test -f build/index.html && \
    echo "Frontend build completed successfully"

# 後端準備階段
FROM base AS backend-builder
WORKDIR /app

# 複製後端源代碼和依賴
COPY package*.json ./
COPY server/ ./server/
COPY scripts/ ./scripts/

# 安裝生產依賴
RUN npm ci --only=production

# 創建必要目錄
RUN mkdir -p uploads logs

# 在運行時創建 uploads 目錄（避免複製問題）
RUN touch uploads/.gitkeep

# 生產階段 - API 服務
FROM node:18-alpine AS api
WORKDIR /app

# 安裝運行時依賴
RUN apk add --no-cache curl

# 複製後端文件
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/scripts ./scripts
COPY --from=backend-builder /app/uploads ./uploads
COPY --from=backend-builder /app/logs ./logs

# 設置權限
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 5000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# 啟動命令
CMD ["node", "server/index.js"]

# 生產階段 - Web 服務
FROM nginx:alpine AS web
WORKDIR /usr/share/nginx/html

# 安裝健康檢查工具
RUN apk add --no-cache curl

# 複製前端構建結果
COPY --from=frontend-builder /app/client/build ./

# 複製 nginx 配置
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# 創建健康檢查腳本
RUN echo '#!/bin/sh\ncurl -f http://localhost/ || exit 1' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh

# 暴露端口
EXPOSE 80

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]