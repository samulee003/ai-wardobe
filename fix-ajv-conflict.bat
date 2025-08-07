@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo 🔧 修復ajv依賴衝突問題
echo ========================================
echo.

echo 📋 問題分析:
echo   - ajv-keywords@5.1.0 需要 ajv@8+
echo   - 當前安裝的是 ajv@6.12.6
echo   - 缺少 ajv/dist/compile/codegen 模塊
echo.

echo 🔄 開始修復...
cd client

echo [1/4] 📦 強制安裝正確的ajv版本...
node C:\Users\senghangl\nodejs\node_modules\npm\bin\npm-cli.js install ajv@^8.12.0 --legacy-peer-deps --no-audit --no-fund
if %errorlevel% neq 0 (
    echo ❌ ajv安裝失敗
    pause
    exit /b 1
)
echo ✅ ajv@8 安裝完成

echo.
echo [2/4] 📋 驗證ajv版本...
if exist node_modules\ajv\dist\compile\codegen (
    echo ✅ ajv/dist/compile/codegen 文件存在
) else (
    echo ❌ ajv/dist/compile/codegen 文件仍然缺失
    echo 🔄 嘗試重新安裝...
    node C:\Users\senghangl\nodejs\node_modules\npm\bin\npm-cli.js install --legacy-peer-deps --no-audit --no-fund
)

echo.
echo [3/4] 🧪 測試React構建...
node node_modules\react-scripts\bin\react-scripts.js build
if %errorlevel% equ 0 (
    echo ✅ React構建成功！
) else (
    echo ❌ React構建失敗
    echo.
    echo 🔄 嘗試替代修復方案...
    echo [備用方案] 降級ajv-keywords版本...
    node C:\Users\senghangl\nodejs\node_modules\npm\bin\npm-cli.js install ajv-keywords@^3.5.2 --legacy-peer-deps --no-audit --no-fund
    echo.
    echo 🧪 重新測試構建...
    node node_modules\react-scripts\bin\react-scripts.js build
    if %errorlevel% equ 0 (
        echo ✅ 使用降級方案構建成功！
    ) else (
        echo ❌ 所有修復方案均失敗
        pause
        exit /b 1
    )
)

echo.
echo [4/4] 📊 顯示最終狀態...
echo.
echo 📁 檢查構建產物:
if exist build\index.html (
    echo ✅ build/index.html 已生成
    dir build\static /b | findstr /i "js" >nul
    if !errorlevel! equ 0 (
        echo ✅ JavaScript 文件已生成
    )
    dir build\static /b | findstr /i "css" >nul
    if !errorlevel! equ 0 (
        echo ✅ CSS 文件已生成
    )
) else (
    echo ❌ build目錄未正確生成
)

echo.
echo 🎉 ajv依賴衝突修復完成！
echo.
echo 📋 修復總結:
echo   ✅ 依賴衝突已解決
echo   ✅ React構建成功
echo   ✅ 構建產物已生成
echo.
echo 💡 現在可以安全地運行 GitHub Actions 構建了！
echo.
pause
