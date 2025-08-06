# AI服務設置指南

## 🚀 推薦的AI服務選擇

### 1. OpenAI GPT-4 Vision (最推薦)
- **優點**: 識別準確度最高，理解能力最強
- **成本**: 約 $0.01-0.03 per image
- **設置**: 
  ```bash
  OPENAI_API_KEY=sk-your-openai-api-key
  PREFERRED_AI_SERVICE=openai
  ```
- **獲取方式**: https://platform.openai.com/api-keys

### 2. Google Gemini Pro Vision (性價比最高)
- **優點**: 免費額度大，性能優秀
- **成本**: 免費額度內無成本
- **設置**:
  ```bash
  GEMINI_API_KEY=your-gemini-api-key
  PREFERRED_AI_SERVICE=gemini
  ```
- **獲取方式**: https://makersuite.google.com/app/apikey

### 3. Anthropic Claude 3 Vision
- **優點**: 細節分析能力強，回應詳細
- **成本**: 約 $0.015 per image
- **設置**:
  ```bash
  ANTHROPIC_API_KEY=your-anthropic-api-key
  PREFERRED_AI_SERVICE=anthropic
  ```
- **獲取方式**: https://console.anthropic.com/

### 4. Google Vision API (備用)
- **優點**: 穩定可靠，傳統選擇
- **成本**: 約 $0.0015 per image
- **設置**:
  ```bash
  GOOGLE_VISION_API_KEY=your-google-vision-api-key
  PREFERRED_AI_SERVICE=google-vision
  ```

## 🛠️ 快速設置步驟

### 步驟1: 選擇AI服務
推薦順序：Gemini (免費) → OpenAI (最強) → Anthropic → Google Vision

### 步驟2: 獲取API密鑰
1. **Gemini (推薦新手)**:
   - 訪問 https://makersuite.google.com/app/apikey
   - 登入Google帳號
   - 點擊 "Create API Key"
   - 複製密鑰

2. **OpenAI (推薦進階用戶)**:
   - 訪問 https://platform.openai.com/api-keys
   - 註冊/登入帳號
   - 點擊 "Create new secret key"
   - 複製密鑰 (以sk-開頭)

### 步驟3: 配置環境變數
```bash
# 複製環境變數模板
cp .env.example .env

# 編輯 .env 文件，加入你的API密鑰
# 例如使用Gemini:
GEMINI_API_KEY=your-actual-api-key-here
PREFERRED_AI_SERVICE=gemini
```

### 步驟4: 測試AI服務
```bash
# 啟動服務器
npm run dev

# 在瀏覽器中訪問 AI設置頁面
# 上傳測試圖片驗證服務是否正常工作
```

## 💡 使用建議

### 對於ADHD用戶的最佳配置:
1. **主服務**: Gemini (免費且快速)
2. **備用服務**: OpenAI (準確度最高)
3. **自動降級**: 啟用，確保服務穩定性

### 成本控制:
- **免費方案**: 只使用Gemini (每月免費額度充足)
- **低成本方案**: Gemini + Google Vision API
- **高品質方案**: OpenAI + Gemini 備用

### 性能優化:
```bash
# 在 .env 中設置
PREFERRED_AI_SERVICE=gemini  # 快速且免費
# 或
PREFERRED_AI_SERVICE=openai  # 最高準確度
```

## 🔧 故障排除

### 常見問題:

1. **API密鑰無效**
   - 檢查密鑰是否正確複製
   - 確認API服務已啟用
   - 檢查帳戶餘額/額度

2. **服務響應慢**
   - 嘗試切換到其他AI服務
   - 檢查網路連接
   - 減小圖片大小

3. **識別準確度低**
   - 確保圖片清晰
   - 嘗試使用OpenAI服務
   - 檢查圖片格式和大小

### 測試命令:
```bash
# 測試所有配置的AI服務
curl -X POST http://localhost:5000/api/ai/service-status \
  -H "Authorization: Bearer your-jwt-token"
```

## 📊 服務比較

| 服務 | 準確度 | 速度 | 成本 | 免費額度 | 推薦指數 |
|------|--------|------|------|----------|----------|
| OpenAI GPT-4V | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| Gemini Pro V | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Claude 3 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Google Vision | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**結論**: 新手推薦Gemini，進階用戶推薦OpenAI + Gemini組合