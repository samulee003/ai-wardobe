@echo off
chcp 65001 >nul
title 智能衣櫃APP - 手機訪問啟動

echo.
echo ==========================================
echo    📱 智能衣櫃APP - 手機訪問模式
echo ==========================================
echo.

:: 獲取本機IP地址
echo 🔍 獲取本機IP地址...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set LOCAL_IP=%%j
        goto :found_ip
    )
)

:found_ip
if "%LOCAL_IP%"=="" (
    echo ❌ 無法獲取IP地址，請手動檢查
    set LOCAL_IP=localhost
)

echo ✅ 本機IP地址: %LOCAL_IP%

:: 檢查Node.js
echo.
echo 📦 檢查Node.js環境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安裝，請先安裝Node.js
    pause
    exit /b 1
)

echo ✅ Node.js已安裝

:: 檢查依賴
echo.
echo 📋 檢查項目依賴...
if not exist "node_modules" (
    echo 📦 安裝後端依賴...
    npm install
)

if not exist "client/node_modules" (
    echo 📦 安裝前端依賴...
    cd client && npm install && cd ..
)

:: 設置環境變數
echo.
echo ⚙️ 配置手機訪問環境...
set HOST=0.0.0.0
set PORT=3000
set REACT_APP_API_URL=http://%LOCAL_IP%:5000

:: 創建手機訪問配置
echo REACT_APP_API_URL=http://%LOCAL_IP%:5000 > client/.env.local
echo HOST=0.0.0.0 >> client/.env.local
echo PORT=3000 >> client/.env.local

:: 啟動後端服務
echo.
echo 🔧 啟動後端服務...
start "後端服務" cmd /k "npm run server"

:: 等待後端啟動
timeout /t 5 >nul

:: 啟動前端服務
echo 🌐 啟動前端服務（手機訪問模式）...
start "前端服務" cmd /k "cd client && npm start"

:: 等待服務啟動
echo ⏳ 等待服務啟動...
timeout /t 10 >nul

:: 顯示訪問信息
echo.
echo ✅ 服務啟動完成！
echo.
echo 📱 手機訪問地址：
echo    http://%LOCAL_IP%:3000
echo.
echo 💻 電腦訪問地址：
echo    http://localhost:3000
echo.
echo 🔧 後端API地址：
echo    http://%LOCAL_IP%:5000
echo.
echo 📋 使用說明：
echo    1. 確保手機和電腦在同一WiFi網絡
echo    2. 在手機瀏覽器中輸入上方地址
echo    3. 允許相機權限以使用拍照功能
echo    4. 可以將網頁添加到手機桌面
echo.
echo 🎯 手機功能：
echo    ✓ 直接拍照上傳衣物
echo    ✓ AI自動識別分析
echo    ✓ 觸摸優化界面
echo    ✓ PWA離線支持
echo    ✓ 行動端優化設計
echo.
echo 📖 詳細指南請查看：docs/MOBILE_GUIDE.md
echo.
echo 🛑 按任意鍵關閉所有服務...
pause >nul

:: 關閉服務
echo.
echo 🛑 正在關閉服務...
taskkill /f /im node.exe >nul 2>&1
echo ✅ 服務已關閉

timeout /t 2 >nul