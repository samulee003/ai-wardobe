@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ==============================================
:: AI 衣櫃 - 前端自動同步腳本（Windows）
:: 將 client/ 子目錄以 git subtree 推送到前端倉庫
:: 目標遠端：frontend = https://github.com/samulee003/ai-wardobe-frontend.git
:: 使用：
::   scripts\windows\autogit-frontend.bat
::   scripts\windows\autogit-frontend.bat "feat: tweak CSP"
:: ==============================================

set REPO_URL=https://github.com/samulee003/ai-wardobe-frontend.git
set TARGET_REMOTE=frontend
set TARGET_BRANCH=main

:: 生成預設提交訊息（當用於可選的快速提交）
set MSG=%*
if "%MSG%"=="" set MSG=chore(frontend): sync %date% %time%

echo.
echo ╔══════════════════════════════════════════════╗
echo ║        🚀 Frontend AutoGit (subtree)         ║
echo ╚══════════════════════════════════════════════╝
echo.

:: 檢查是否在 git 倉庫內
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo ❌ 當前資料夾不是 Git 倉庫
  exit /b 1
)

:: 檢查是否有未提交更改，詢問是否自動提交
git diff-index --quiet HEAD --
if not errorlevel 0 (
  echo 🔄 偵測到未提交更改
  set /p DO_COMMIT="是否先建立提交再同步? (Y/N): "
  if /I "%DO_COMMIT%"=="Y" (
    echo ➕ git add -A
    git add -A || goto :err
    echo 💾 git commit -m "%MSG%"
    git commit -m "%MSG%" || goto :err
  )
)

:: 檢查/建立遠端 frontend
for /f "delims=" %%u in ('git remote 2^>nul ^| findstr /b /c:"%TARGET_REMOTE%"') do set HAS_REMOTE=1
if not defined HAS_REMOTE (
  echo 🌐 新增遠端 %TARGET_REMOTE% -> %REPO_URL%
  git remote add %TARGET_REMOTE% %REPO_URL% || goto :err
)

echo 🔄 取得遠端狀態（%TARGET_REMOTE%）
git fetch %TARGET_REMOTE% --prune || goto :err

:: 清理既有前端拆分分支（若存在）
git branch -D frontend-split >nul 2>&1

echo 🌳 以 subtree 建立前端分支（client/）
git subtree split --prefix=client -b frontend-split || goto :err

echo ⬆️  推送到 %TARGET_REMOTE%:%TARGET_BRANCH%
git push -u %TARGET_REMOTE% frontend-split:%TARGET_BRANCH%
if errorlevel 1 goto :err

echo 🧹 清理臨時分支
git branch -D frontend-split >nul 2>&1

echo.
echo ✅ 前端同步完成！
echo    目標：%REPO_URL%（分支：%TARGET_BRANCH%）
echo.
exit /b 0

:err
echo.
echo ❌ 發生錯誤，流程終止（錯誤碼：%errorlevel%）
exit /b %errorlevel%



