@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ========================================
:: GitHub Actions本地故障排除腳本
:: 用於診斷和修復常見問題
:: ========================================

color 0C
echo.
echo ╔══════════════════════════════════════════╗
echo ║     🔧 GitHub Actions 故障排除工具       ║
echo ║        診斷和修復構建問題                ║
echo ╚══════════════════════════════════════════╝
echo.

echo 🔍 開始診斷...
echo.

:: 檢查1: Node.js和NPM版本
echo [1/8] 🟡 檢查Node.js環境...
echo Node版本:
node --version
echo NPM版本:
npm --version
echo.

:: 檢查2: Java環境
echo [2/8] ☕ 檢查Java環境...
java -version 2>&1 | findstr "version" || echo ❌ Java未安裝或未配置
echo.

:: 檢查3: Android SDK
echo [3/8] 🤖 檢查Android SDK...
if defined ANDROID_HOME (
    echo ✅ ANDROID_HOME已設置: %ANDROID_HOME%
    if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
        echo ✅ ADB工具存在
    ) else (
        echo ❌ ADB工具不存在
    )
) else (
    echo ❌ ANDROID_HOME環境變量未設置
)
echo.

:: 檢查4: 項目依賴
echo [4/8] 📦 檢查項目依賴...
if exist package-lock.json (
    echo ✅ 根目錄package-lock.json存在
) else (
    echo ⚠️  根目錄package-lock.json不存在
)

if exist client\package-lock.json (
    echo ✅ 客戶端package-lock.json存在
) else (
    echo ⚠️  客戶端package-lock.json不存在
)

if exist node_modules (
    echo ✅ 根目錄node_modules存在
) else (
    echo ❌ 根目錄node_modules不存在
)

if exist client\node_modules (
    echo ✅ 客戶端node_modules存在
) else (
    echo ❌ 客戶端node_modules不存在
)
echo.

:: 檢查5: Capacitor配置
echo [5/8] ⚡ 檢查Capacitor配置...
if exist client\capacitor.config.ts (
    echo ✅ Capacitor配置文件存在
    cd client
    npx cap config 2>nul || echo ⚠️  Capacitor配置可能有問題
    cd ..
) else (
    echo ❌ Capacitor配置文件不存在
)
echo.

:: 檢查6: Android平台
echo [6/8] 📱 檢查Android平台...
if exist client\android (
    echo ✅ Android平台目錄存在
    if exist client\android\gradlew.bat (
        echo ✅ Gradle Wrapper存在
    ) else (
        echo ❌ Gradle Wrapper不存在
    )
) else (
    echo ❌ Android平台目錄不存在
    echo 💡 運行以下命令添加Android平台:
    echo    cd client ^&^& npx cap add android
)
echo.

:: 檢查7: 關鍵依賴版本
echo [7/8] 🔍 檢查關鍵依賴版本...
if exist node_modules\multer (
    echo ✅ Multer已安裝
) else (
    echo ❌ Multer未安裝
)

if exist client\node_modules\@capacitor (
    echo ✅ Capacitor已安裝
    echo Capacitor版本信息:
    cd client
    npx cap --version 2>nul || echo ⚠️  無法獲取Capacitor版本
    cd ..
) else (
    echo ❌ Capacitor未安裝
)
echo.

:: 檢查8: 磁盤空間
echo [8/8] 💾 檢查磁盤空間...
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do (
    set /a free_space=%%a/1024/1024/1024
    echo 可用磁盤空間: !free_space! GB
    if !free_space! LSS 5 (
        echo ⚠️  磁盤空間不足 ^(建議至少5GB^)
    ) else (
        echo ✅ 磁盤空間充足
    )
)
echo.

:: 提供修復建議
echo 🔧 修復建議:
echo.
echo 📋 常見問題修復:
echo [A] 如果依賴安裝失敗: npm run deps:fresh
echo [B] 如果Android平台缺失: cd client ^&^& npx cap add android
echo [C] 如果Java版本不對: 安裝JDK 17+
echo [D] 如果Android SDK問題: 檢查ANDROID_HOME環境變量
echo [E] 如果Capacitor問題: cd client ^&^& npx cap sync
echo.

echo 🚀 快速修復腳本:
echo [1] 重新安裝所有依賴: npm run deps:fresh
echo [2] 重置Capacitor: cd client ^&^& npx cap sync android
echo [3] 清理並重建: npm run deps:clean ^&^& npm run ci:build
echo.

set /p choice="選擇要執行的修復操作 (1-3, 或按Enter跳過): "
if "%choice%"=="1" (
    echo 🔄 執行依賴重新安裝...
    call npm run deps:fresh
) else if "%choice%"=="2" (
    echo 🔄 執行Capacitor重置...
    cd client
    call npx cap sync android
    cd ..
) else if "%choice%"=="3" (
    echo 🔄 執行清理並重建...
    call npm run deps:clean
    call npm run ci:build
) else (
    echo ℹ️  跳過自動修復
)

echo.
echo 🎯 診斷完成！
echo.
echo 💡 提示: 如果問題持續存在，請檢查:
echo   1. GitHub Actions中的具體錯誤信息
echo   2. Android Studio的SDK Manager設置
echo   3. 網絡連接是否穩定
echo.
pause
