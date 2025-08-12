前後端分離指南
1
- 後端=server 內容獨立成倉庫, 需設 KIMI_API_KEY / PREFERRED_AI_SERVICE / MONGODB_URI
- 前端=client 內容獨立成倉庫, .env 設 REACT_APP_API_URL
- Zeabur: 部署後端, 設環境變數, 取得 API 網域
- 前端: .env 指向該 API, build 或打包 APK
- 一鍵匯出: 執行 scripts\export-split.cmd 產出 dist-split\backend 與 dist-split\frontend
