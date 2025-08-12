
# Zeabur 環境變數設定指南

## 必要環境變數

### 1. 資料庫連接
```
MONGODB_URI=${mongodb.connectionString}
MONGODB_URL=${mongodb.connectionString}
```

### 2. KIMI AI 配置
```
KIMI_API_KEY=your-kimi-api-key-here
PREFERRED_AI_SERVICE=kimi
KIMI_VISION_MODEL=moonshot-v1-8k-vision-preview
```

### 3. 基本配置
```
NODE_ENV=production
PORT=8080
JWT_SECRET=your-secure-jwt-secret-here
```

## 檢查步驟

1. 登入 Zeabur 控制台
2. 進入專案設定
3. 確認 Environment Variables 包含上述設定
4. 特別確認 KIMI_API_KEY 已正確設定
5. 重新部署應用

## 常見問題

- 500 錯誤通常是 MONGODB_URI 或 KIMI_API_KEY 缺失
- CORS 錯誤已在代碼中修復
- 文件上傳需要 multer 正確配置（已完成）

