@echo off
setlocal enabledelayedexpansion

REM ==============================================
REM  AI Wardrobe 一鍵推送腳本 (Windows .bat)
REM  功能：
REM   1) 提交目前變更到當前分支並推送到 origin/main
REM   2) 同步 client 子樹到前端倉庫 main 分支
REM   3) 同步 server 子樹到後端倉庫 main 分支
REM  參數：
REM    autogit-all.bat "<commit message>" [/F]
REM    - /F 允許覆蓋式同步（force）至前/後端倉庫（需人工同意）
REM  注意：預設不使用 --force；若遠端歷史分歧請加 /F。
REM ==============================================

set MSG=%*
set FORCE_FLAG=

REM 解析 /F 旗標
for %%I in (%*) do (
  if /I "%%~I"=="/F" set FORCE_FLAG=/F
)

REM 去掉 /F 從 commit 訊息
if defined FORCE_FLAG (
  set MSG=%MSG:/F=%
  set MSG=%MSG:/f=%
)

if "%MSG%"=="" (
  for /f "tokens=1-3 delims=/ " %%a in ("%DATE%") do set TODAY=%%a-%%b-%%c
  set MSG=chore: autopush at %TODAY% %TIME%
)

echo.
echo [1/6] 檢查與配置遠端倉庫 ...
call :ensure_remote frontend https://github.com/samulee003/ai-wardobe-frontend.git
if errorlevel 1 goto :end_error
call :ensure_remote backend  https://github.com/samulee003/ai-wardobe--backend.git
if errorlevel 1 goto :end_error

echo.
echo [2/6] 提交本倉庫變更到 origin/main ...
git add -A
git diff --cached --quiet && echo 無暫存變更，略過提交 || git commit -m "%MSG%"
for /f %%B in ('git rev-parse --abbrev-ref HEAD') do set CURBR=%%B
if "%CURBR%"=="" set CURBR=main
git push origin %CURBR%:main
if errorlevel 1 goto :end_error

echo.
echo [3/6] 生成 client 子樹分支 ...
git branch -D frontend-split >nul 2>&1
git subtree split --prefix client -b frontend-split
if errorlevel 1 goto :end_error

echo.
echo [4/6] 推送到前端倉庫 main 分支 ...
if defined FORCE_FLAG (
  echo 使用覆蓋式同步到前端倉庫（--force）
  git push -f frontend frontend-split:main
) else (
  git push frontend frontend-split:main
  if errorlevel 1 (
    echo ！前端倉庫推送失敗：可能存在歷史分歧。若確認覆蓋，請重新執行並加上 /F。
  )
)
git branch -D frontend-split >nul 2>&1

echo.
echo [5/6] 生成 server 子樹分支 ...
git branch -D backend-split >nul 2>&1
git subtree split --prefix server -b backend-split
if errorlevel 1 goto :end_error

echo.
echo [6/6] 推送到後端倉庫 main 分支 ...
if defined FORCE_FLAG (
  echo 使用覆蓋式同步到後端倉庫（--force）
  git push -f backend backend-split:main
) else (
  git push backend backend-split:main
  if errorlevel 1 (
    echo ！後端倉庫推送失敗：可能存在歷史分歧。若確認覆蓋，請重新執行並加上 /F。
  )
)
git branch -D backend-split >nul 2>&1

echo.
echo ✅ 完成：origin、前端、後端已同步。
goto :eof

:ensure_remote
REM %1 = 名稱, %2 = URL
git remote get-url %1 >nul 2>&1
if errorlevel 1 (
  echo 未發現遠端 %1 ，正在新增 ...
  git remote add %1 %2
  if errorlevel 1 (
    echo 新增遠端 %1 失敗
    exit /b 1
  )
) else (
  echo 遠端 %1 已存在
)
exit /b 0

:end_error
echo ❌ 發生錯誤，流程中止。
exit /b 1


