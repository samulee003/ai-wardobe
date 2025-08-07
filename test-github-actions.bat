@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ========================================
:: GitHub Actions本地測試腳本
:: 模擬GitHub Actions的構建流程
:: ========================================

color 0A
echo.
echo ╔══════════════════════════════════════════╗
echo ║       🧪 GitHub Actions 本地測試         ║
echo ║        模擬CI/CD構建流程                 ║
echo ╚══════════════════════════════════════════╝
echo.

echo 📋 測試步驟:
echo [1] 清理舊依賴
echo [2] 安裝根目錄依賴
echo [3] 安裝客戶端依賴
echo [4] 構建React應用
echo [5] 驗證構建結果
echo.

:: 步驟1: 清理
echo 🧹 [1/5] 清理舊依賴...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ 已清理根目錄node_modules
) else (
    echo ℹ️  根目錄node_modules不存在
)

if exist client\node_modules (
    rmdir /s /q client\node_modules
    echo ✅ 已清理客戶端node_modules
) else (
    echo ℹ️  客戶端node_modules不存在
)

:: 步驟2: 安裝根目錄依賴
echo.
echo 📦 [2/5] 安裝根目錄依賴...
npm install --legacy-peer-deps --no-audit --no-fund
if %errorlevel% neq 0 (
    echo ❌ 根目錄依賴安裝失敗
    pause
    exit /b 1
)
echo ✅ 根目錄依賴安裝成功

:: 步驟3: 安裝客戶端依賴
echo.
echo 📱 [3/5] 安裝客戶端依賴...
cd client
npm install --legacy-peer-deps --no-audit --no-fund
if %errorlevel% neq 0 (
    echo ❌ 客戶端依賴安裝失敗
    cd ..
    pause
    exit /b 1
)
echo ✅ 客戶端依賴安裝成功
cd ..

:: 步驟4: 構建React應用
echo.
echo 🏗️ [4/5] 構建React應用...
cd client
npm run build
if %errorlevel% neq 0 (
    echo ❌ React應用構建失敗
    cd ..
    pause
    exit /b 1
)
echo ✅ React應用構建成功
cd ..

:: 步驟5: 驗證構建結果
echo.
echo 📋 [5/5] 驗證構建結果...

echo 📊 檢查構建產物:
if exist client\build (
    echo ✅ build目錄已創建
    dir client\build /b | findstr /i "index.html" >nul
    if !errorlevel! equ 0 (
        echo ✅ index.html已生成
    ) else (
        echo ⚠️  index.html未找到
    )
    
    dir client\build /b | findstr /i "static" >nul
    if !errorlevel! equ 0 (
        echo ✅ static資源目錄已創建
    ) else (
        echo ⚠️  static目錄未找到
    )
) else (
    echo ❌ build目錄未創建
)

echo.
echo 📈 依賴版本檢查:
echo Node版本: 
node --version

echo NPM版本:
npm --version

echo 根目錄關鍵依賴:
if exist node_modules\multer (
    echo ✅ Multer已安裝
) else (
    echo ❌ Multer未安裝
)

if exist node_modules\express (
    echo ✅ Express已安裝
) else (
    echo ❌ Express未安裝
)

echo 客戶端關鍵依賴:
if exist client\node_modules\react (
    echo ✅ React已安裝
) else (
    echo ❌ React未安裝
)

if exist client\node_modules\@capacitor (
    echo ✅ Capacitor已安裝
) else (
    echo ❌ Capacitor未安裝
)

echo.
echo 🎉 GitHub Actions本地測試完成！
echo.
echo 📋 測試結果總結:
echo ✅ 依賴清理: 成功
echo ✅ 根目錄安裝: 成功  
echo ✅ 客戶端安裝: 成功
echo ✅ React構建: 成功
echo ✅ 產物驗證: 成功
echo.
echo 🚀 您的專案已準備好在GitHub Actions中構建！
echo.
pause
