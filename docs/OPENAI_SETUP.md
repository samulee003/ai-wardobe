# 啟用 OpenAI 圖片分析 (Server)

1. 準備環境變數

在部署平台或本機設定：

```
PREFERRED_AI_SERVICE=openai
OPENAI_API_KEY=sk-xxxx
```

2. 重啟後端服務

3. 驗證

- 上傳圖片後，伺服器日誌應顯示 OpenAI 呼叫成功，回傳物件包含：
  - `aiService: 'openai'`
  - `latencyMs: <數值>`

4. 疑難排解

- 401/403：金鑰錯誤或權限不足
- 429：限流，稍後重試
- 超時：已內建 15s 逾時與一次重試；仍失敗則回退到 `fallback` 分析


