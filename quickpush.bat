@echo off
chcp 65001 >nul
title 快速推送到GitHub

echo 🚀 快速推送到GitHub...

:: 添加所有變更
git add .

:: 使用時間戳作為提交信息
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%"

:: 提交
git commit -m "🔄 自動更新 - %timestamp%"

:: 推送
git push origin main || git push origin master

if errorlevel 1 (
    echo ❌ 推送失敗！請檢查網絡和認證設置
    pause
) else (
    echo ✅ 推送成功！
    echo 🌐 查看項目: https://github.com/samulee003/ai-wardobe
)

timeout /t 3 >nul