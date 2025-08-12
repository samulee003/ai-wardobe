@echo off
setlocal enabledelayedexpansion

REM ASCII-only one-click push script to avoid codepage issues
REM Usage: autogit-all.bat "<commit message>" [/F]

set "MSG=%~1"
set "FORCE_FLAG="
set "OPT=%~2"
if /I "%OPT%"=="/F" set FORCE_FLAG=/F

if "%MSG%"=="" set "MSG=chore: one-click sync"

echo [1/6] Ensure remotes
call :ensure_remote frontend https://github.com/samulee003/ai-wardobe-frontend.git || goto :end_error
call :ensure_remote backend  https://github.com/samulee003/ai-wardobe--backend.git || goto :end_error

echo [2/6] Commit & push to origin/main
git add -A
git diff --cached --quiet
if %ERRORLEVEL%==0 (
  echo No staged changes
) else (
  git commit -m "%MSG%"
)
for /f %%B in ('git rev-parse --abbrev-ref HEAD') do set CURBR=%%B
if "%CURBR%"=="" set CURBR=main
git push origin %CURBR%:main || goto :end_error

echo [3/6] Build client subtree
git branch -D frontend-split >nul 2>&1
git subtree split --prefix client -b frontend-split || goto :end_error

echo [4/6] Push frontend subtree
if defined FORCE_FLAG (
  git push -f frontend frontend-split:main || goto :end_error
) else (
  git push frontend frontend-split:main || goto :end_error
)
git branch -D frontend-split >nul 2>&1

echo [5/6] Build server subtree
git branch -D backend-split >nul 2>&1
git subtree split --prefix server -b backend-split || goto :end_error

echo [6/6] Push backend subtree
if defined FORCE_FLAG (
  git push -f backend backend-split:main || goto :end_error
) else (
  git push backend backend-split:main || goto :end_error
)
git branch -D backend-split >nul 2>&1

echo Done: origin, frontend and backend are in sync.
goto :eof

:ensure_remote
git remote get-url %1 >nul 2>&1
if errorlevel 1 (
  git remote add %1 %2 || exit /b 1
)
exit /b 0

:end_error
echo Error occurred. Aborting.
exit /b 1


