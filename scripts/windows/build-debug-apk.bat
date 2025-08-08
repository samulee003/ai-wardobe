@echo off
echo 🚀 構建調試版 APK (無需簽名)...

cd client

echo 📋 安裝依賴...
call npm install

echo 🔧 構建應用...
call npm run build

echo 📱 同步到 Android...
call npx cap sync android

echo 🏗️ 構建調試 APK...
cd android
call gradlew assembleDebug

echo.
echo ✅ 調試 APK 構建完成！
echo 📁 APK 位置: client\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 📱 您可以直接安裝這個 APK 到 Android 設備上測試
pause