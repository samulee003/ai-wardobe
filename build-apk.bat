@echo off
echo 🚀 開始構建智能衣櫥 Android APK...

echo.
echo 📋 步驟 1: 安裝依賴
cd client
call npm install

echo.
echo 🔧 步驟 2: 構建 React 應用
call npm run build

echo.
echo 📱 步驟 3: 同步到 Android 項目
call npx cap sync android

echo.
echo 🏗️ 步驟 4: 打開 Android Studio 進行最終構建
echo.
echo ⚠️  請在 Android Studio 中：
echo    1. 點擊 Build ^> Generate Signed Bundle / APK
echo    2. 選擇 APK
echo    3. 選擇 release 模式
echo    4. 生成的 APK 將在 android/app/build/outputs/apk/release/ 目錄
echo.

call npx cap open android

echo.
echo ✅ Android Studio 已打開！
echo 📱 請按照上述步驟生成 APK 文件
pause