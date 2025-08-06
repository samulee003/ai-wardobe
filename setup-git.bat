@echo off
chcp 65001 >nul
title Git初始設置

echo.
echo ==========================================
echo      🔧 Git初始設置工具
echo ==========================================
echo.

:: 檢查Git是否安裝
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git未安裝！
    echo 請從 https://git-scm.com/ 下載並安裝Git
    pause
    exit /b 1
)

echo ✅ Git已安裝
echo.

:: 設置用戶信息
echo 📝 設置Git用戶信息...
echo.

set /p username="請輸入您的GitHub用戶名: "
set /p email="請輸入您的GitHub郵箱: "

if "%username%"=="" (
    echo ❌ 用戶名不能為空
    pause
    exit /b 1
)

if "%email%"=="" (
    echo ❌ 郵箱不能為空
    pause
    exit /b 1
)

:: 配置Git
echo.
echo 🔧 配置Git設置...
git config --global user.name "%username%"
git config --global user.email "%email%"

:: 設置默認分支名
git config --global init.defaultBranch main

:: 設置推送策略
git config --global push.default simple

:: 設置編碼
git config --global core.quotepath false

echo.
echo ✅ Git配置完成！
echo.
echo 📋 當前配置：
echo    用戶名: %username%
echo    郵箱: %email%
echo    默認分支: main
echo.

:: 檢查是否已經是Git倉庫
if exist ".git" (
    echo ✅ 當前目錄已是Git倉庫
) else (
    echo 📁 初始化Git倉庫...
    git init
    
    echo 🔗 添加遠程倉庫...
    git remote add origin https://github.com/samulee003/ai-wardobe.git
    
    echo ✅ Git倉庫初始化完成！
)

echo.
echo 🎉 設置完成！現在您可以使用以下腳本：
echo    autogit.bat     - 完整的Git推送工具
echo    quickpush.bat   - 快速推送工具
echo.

pause