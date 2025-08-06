@echo off
chcp 65001 >nul
title 智能衣櫃APP - 自動Git推送

echo.
echo ==========================================
echo    🚀 智能衣櫃APP - 自動Git推送工具
echo ==========================================
echo.

:: 檢查是否在Git倉庫中
if not exist ".git" (
    echo ❌ 錯誤：當前目錄不是Git倉庫
    echo 請確保在項目根目錄中運行此腳本
    pause
    exit /b 1
)

:: 顯示當前狀態
echo 📊 檢查當前Git狀態...
git status --porcelain > temp_status.txt
set /p git_changes=<temp_status.txt
del temp_status.txt

if "%git_changes%"=="" (
    echo ℹ️  沒有新的變更需要提交
    echo.
    echo 🔍 檢查是否需要推送...
    git status | findstr "ahead" >nul
    if errorlevel 1 (
        echo ✅ 所有變更都已同步到GitHub
        goto :end
    ) else (
        echo 📤 發現未推送的提交，正在推送...
        goto :push
    )
) else (
    echo 📝 發現新的變更，準備提交...
)

:: 顯示變更的文件
echo.
echo 📋 變更的文件：
git status --short

:: 詢問提交信息
echo.
set /p commit_msg="💬 請輸入提交信息 (直接按Enter使用默認信息): "

if "%commit_msg%"=="" (
    set "commit_msg=🔄 更新智能衣櫃APP - %date% %time%"
)

:: 添加所有變更
echo.
echo 📦 添加所有變更到暫存區...
git add .

if errorlevel 1 (
    echo ❌ 添加文件失敗
    goto :error
)

:: 提交變更
echo 💾 提交變更...
git commit -m "%commit_msg%"

if errorlevel 1 (
    echo ❌ 提交失敗
    goto :error
)

:push
:: 推送到GitHub
echo.
echo 🌐 推送到GitHub...
echo 正在推送到: https://github.com/samulee003/ai-wardobe.git

git push origin main

if errorlevel 1 (
    echo.
    echo ⚠️  推送到main分支失敗，嘗試推送到master分支...
    git push origin master
    
    if errorlevel 1 (
        echo.
        echo ❌ 推送失敗！可能的原因：
        echo    1. 網絡連接問題
        echo    2. GitHub認證問題
        echo    3. 權限不足
        echo.
        echo 💡 解決方案：
        echo    1. 檢查網絡連接
        echo    2. 設置GitHub Personal Access Token
        echo    3. 確認倉庫權限
        echo.
        echo 🔧 手動推送命令：
        echo    git push origin main
        goto :error
    )
)

:: 成功完成
echo.
echo ✅ 成功推送到GitHub！
echo.
echo 🎉 您的智能衣櫃APP已更新到：
echo    https://github.com/samulee003/ai-wardobe
echo.
echo 📊 推送統計：
git log --oneline -5
echo.

goto :end

:error
echo.
echo ❌ 操作失敗！
echo 請檢查錯誤信息並手動處理
echo.
pause
exit /b 1

:end
echo.
echo 🏁 操作完成！
echo.
echo 📋 常用Git命令：
echo    git status          - 查看狀態
echo    git log --oneline   - 查看提交歷史
echo    git pull            - 拉取最新變更
echo.
echo 🔄 再次運行此腳本可以推送新的變更
echo.
pause