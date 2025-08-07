@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ========================================
:: AI衣櫃專案 - 自動化Git工作流程腳本
:: 創建日期: %date%
:: 功能: 自動化常見的Git操作
:: ========================================

color 0A
echo.
echo ╔══════════════════════════════════════════╗
echo ║          🚀 AI衣櫃 AutoGit 工具           ║
echo ║      自動化Git工作流程管理腳本            ║
echo ╚══════════════════════════════════════════╝
echo.

:: 檢查是否在Git倉庫中
git status >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ 錯誤: 當前目錄不是Git倉庫
    echo 請在Git倉庫根目錄中運行此腳本
    pause
    exit /b 1
)

:: 顯示當前Git狀態
echo 📊 當前Git狀態:
echo ----------------------------------------
git status --short
echo.

:: 檢查是否有未提交的更改
git diff-index --quiet HEAD --
if %errorlevel% neq 0 (
    set HAS_CHANGES=1
    echo 🔄 檢測到未提交的更改
) else (
    set HAS_CHANGES=0
    echo ✅ 工作目錄乾淨，無未提交更改
)
echo.

:: 主選單
:MAIN_MENU
echo ╔══════════════════════════════════════════╗
echo ║              🛠️  操作選單                 ║
echo ╚══════════════════════════════════════════╝
echo.
echo [1] 📝 快速提交 (add + commit + push)
echo [2] 🔍 檢視詳細狀態和歷史
echo [3] 🌿 分支管理
echo [4] 🔄 同步遠程倉庫 (pull + push)
echo [5] 📦 建立發布標籤
echo [6] 🧹 清理和維護
echo [7] 🚨 緊急回滾
echo [8] 📋 顯示完整日誌
echo [9] ⚙️  高級操作
echo [0] 🚪 退出
echo.
set /p choice="請選擇操作 (0-9): "

if "%choice%"=="1" goto QUICK_COMMIT
if "%choice%"=="2" goto VIEW_STATUS
if "%choice%"=="3" goto BRANCH_MANAGEMENT
if "%choice%"=="4" goto SYNC_REMOTE
if "%choice%"=="5" goto CREATE_TAG
if "%choice%"=="6" goto CLEANUP
if "%choice%"=="7" goto EMERGENCY_ROLLBACK
if "%choice%"=="8" goto VIEW_LOGS
if "%choice%"=="9" goto ADVANCED_OPS
if "%choice%"=="0" goto EXIT
goto INVALID_CHOICE

:: ========================================
:: 1. 快速提交功能
:: ========================================
:QUICK_COMMIT
echo.
echo 🚀 快速提交模式
echo ========================================

if !HAS_CHANGES!==0 (
    echo ℹ️  沒有需要提交的更改
    echo.
    goto MAIN_MENU
)

:: 顯示將要提交的文件
echo 📋 將要提交的文件:
git diff --name-status
echo.

:: 獲取提交信息
set /p commit_msg="💬 請輸入提交信息: "
if "!commit_msg!"=="" (
    echo ⚠️  提交信息不能為空
    goto QUICK_COMMIT
)

:: 檢查提交信息長度
set str=!commit_msg!
set length=0
:LENGTH_LOOP
if defined str (
    set str=!str:~1!
    set /a length+=1
    goto LENGTH_LOOP
)

if !length! LSS 10 (
    echo ⚠️  提交信息太短，建議至少10個字符
    set /p confirm="是否繼續? (y/N): "
    if /i not "!confirm!"=="y" goto QUICK_COMMIT
)

echo.
echo 🔄 執行Git操作...

:: 添加所有更改
echo [1/4] 📁 添加文件... 
git add .
if %errorlevel% neq 0 (
    echo ❌ Git add 失敗
    goto ERROR_HANDLER
)
echo ✅ 文件添加完成

:: 提交更改
echo [2/4] 💾 提交更改...
git commit -m "!commit_msg!"
if %errorlevel% neq 0 (
    echo ❌ Git commit 失敗
    goto ERROR_HANDLER
)
echo ✅ 提交完成

:: 檢查遠程倉庫
echo [3/4] 🌐 檢查遠程倉庫...
git remote -v | findstr origin >nul
if %errorlevel% neq 0 (
    echo ⚠️  未設置遠程倉庫，跳過推送
    goto COMMIT_SUCCESS
)

:: 推送到遠程
echo [4/4] ⬆️  推送到遠程倉庫...
git push
if %errorlevel% neq 0 (
    echo ⚠️  推送失敗，可能需要先拉取遠程更改
    set /p pull_choice="是否先拉取遠程更改? (y/N): "
    if /i "!pull_choice!"=="y" (
        git pull --rebase
        if !errorlevel! equ 0 (
            git push
            if !errorlevel! equ 0 (
                echo ✅ 推送成功
            ) else (
                echo ❌ 推送仍然失敗
            )
        )
    )
) else (
    echo ✅ 推送完成
)

:COMMIT_SUCCESS
echo.
echo 🎉 快速提交完成!
echo 📊 提交信息: !commit_msg!
echo 🕒 時間: %date% %time%
echo.
pause
goto MAIN_MENU

:: ========================================
:: 2. 檢視詳細狀態
:: ========================================
:VIEW_STATUS
echo.
echo 🔍 詳細Git狀態
echo ========================================

echo 📊 工作目錄狀態:
git status
echo.

echo 📈 最近5次提交:
git log --oneline -5 --decorate --graph
echo.

echo 🌿 本地分支:
git branch
echo.

echo 🌐 遠程分支:
git branch -r
echo.

echo 📝 暫存區狀態:
git diff --cached --name-status
if %errorlevel% neq 0 echo 暫存區為空
echo.

pause
goto MAIN_MENU

:: ========================================
:: 3. 分支管理
:: ========================================
:BRANCH_MANAGEMENT
echo.
echo 🌿 分支管理
echo ========================================

echo 當前分支:
git branch --show-current
echo.

echo 所有分支:
git branch -a
echo.

echo [1] 創建新分支
echo [2] 切換分支
echo [3] 合併分支
echo [4] 刪除分支
echo [5] 返回主選單
echo.
set /p branch_choice="請選擇操作: "

if "%branch_choice%"=="1" (
    set /p new_branch="輸入新分支名稱: "
    if not "!new_branch!"=="" (
        git checkout -b !new_branch!
        echo ✅ 分支 !new_branch! 創建並切換成功
    )
)

if "%branch_choice%"=="2" (
    set /p target_branch="輸入要切換的分支名稱: "
    if not "!target_branch!"=="" (
        git checkout !target_branch!
        if !errorlevel! equ 0 (
            echo ✅ 切換到分支 !target_branch! 成功
        )
    )
)

if "%branch_choice%"=="3" (
    set /p merge_branch="輸入要合併的分支名稱: "
    if not "!merge_branch!"=="" (
        git merge !merge_branch!
        if !errorlevel! equ 0 (
            echo ✅ 分支 !merge_branch! 合併成功
        )
    )
)

if "%branch_choice%"=="4" (
    set /p delete_branch="輸入要刪除的分支名稱: "
    if not "!delete_branch!"=="" (
        git branch -d !delete_branch!
        if !errorlevel! equ 0 (
            echo ✅ 分支 !delete_branch! 刪除成功
        )
    )
)

if "%branch_choice%"=="5" goto MAIN_MENU

pause
goto BRANCH_MANAGEMENT

:: ========================================
:: 4. 同步遠程倉庫
:: ========================================
:SYNC_REMOTE
echo.
echo 🔄 同步遠程倉庫
echo ========================================

echo 🌐 獲取遠程更新...
git fetch
if %errorlevel% neq 0 (
    echo ❌ 獲取遠程更新失敗
    pause
    goto MAIN_MENU
)

echo 📊 比較本地與遠程:
git status -uno
echo.

echo 🔽 拉取遠程更改...
git pull --rebase
if %errorlevel% neq 0 (
    echo ⚠️  拉取遠程更改時遇到衝突
    echo 請手動解決衝突後重新運行腳本
    pause
    goto MAIN_MENU
)

if !HAS_CHANGES!==1 (
    echo 🔼 推送本地更改...
    git push
    if %errorlevel% neq 0 (
        echo ❌ 推送失敗
    ) else (
        echo ✅ 推送成功
    )
)

echo ✅ 同步完成
pause
goto MAIN_MENU

:: ========================================
:: 5. 建立發布標籤
:: ========================================
:CREATE_TAG
echo.
echo 📦 建立發布標籤
echo ========================================

echo 現有標籤:
git tag -l
echo.

set /p tag_name="輸入標籤名稱 (例如: v1.0.0): "
if "%tag_name%"=="" (
    echo ⚠️  標籤名稱不能為空
    pause
    goto MAIN_MENU
)

set /p tag_message="輸入標籤描述: "
if "%tag_message%"=="" set tag_message=Release %tag_name%

git tag -a %tag_name% -m "%tag_message%"
if %errorlevel% neq 0 (
    echo ❌ 標籤創建失敗
    pause
    goto MAIN_MENU
)

echo ✅ 標籤 %tag_name% 創建成功

set /p push_tag="是否推送標籤到遠程? (y/N): "
if /i "%push_tag%"=="y" (
    git push origin %tag_name%
    if !errorlevel! equ 0 (
        echo ✅ 標籤推送成功
    ) else (
        echo ❌ 標籤推送失敗
    )
)

pause
goto MAIN_MENU

:: ========================================
:: 6. 清理和維護
:: ========================================
:CLEANUP
echo.
echo 🧹 清理和維護
echo ========================================

echo [1] 清理未跟蹤的文件
echo [2] 垃圾回收
echo [3] 檢查倉庫完整性
echo [4] 清理遠程追蹤分支
echo [5] 返回主選單
echo.
set /p clean_choice="請選擇操作: "

if "%clean_choice%"=="1" (
    echo 未跟蹤的文件:
    git clean -n
    set /p confirm_clean="確認刪除這些文件? (y/N): "
    if /i "!confirm_clean!"=="y" (
        git clean -f
        echo ✅ 清理完成
    )
)

if "%clean_choice%"=="2" (
    echo 🗑️  執行垃圾回收...
    git gc --aggressive
    echo ✅ 垃圾回收完成
)

if "%clean_choice%"=="3" (
    echo 🔍 檢查倉庫完整性...
    git fsck
    echo ✅ 完整性檢查完成
)

if "%clean_choice%"=="4" (
    echo 🌐 清理遠程追蹤分支...
    git remote prune origin
    echo ✅ 清理完成
)

if "%clean_choice%"=="5" goto MAIN_MENU

pause
goto CLEANUP

:: ========================================
:: 7. 緊急回滾
:: ========================================
:EMERGENCY_ROLLBACK
echo.
echo 🚨 緊急回滾
echo ========================================
color 0E

echo ⚠️  警告: 此操作可能會丟失未保存的更改!
echo.

echo [1] 撤銷最後一次提交 (保留更改)
echo [2] 強制重置到上一次提交 (丟失更改)
echo [3] 重置到指定提交
echo [4] 返回主選單
echo.
set /p rollback_choice="請選擇操作: "

if "%rollback_choice%"=="1" (
    git reset --soft HEAD~1
    echo ✅ 最後一次提交已撤銷，更改保留在暫存區
)

if "%rollback_choice%"=="2" (
    set /p confirm_hard="確認強制重置? 這將丟失所有未提交的更改! (y/N): "
    if /i "!confirm_hard!"=="y" (
        git reset --hard HEAD~1
        echo ✅ 強制重置完成
    )
)

if "%rollback_choice%"=="3" (
    echo 最近的提交:
    git log --oneline -10
    echo.
    set /p commit_hash="輸入要重置到的提交哈希: "
    if not "!commit_hash!"=="" (
        git reset --hard !commit_hash!
        echo ✅ 重置到 !commit_hash! 完成
    )
)

if "%rollback_choice%"=="4" (
    color 0A
    goto MAIN_MENU
)

color 0A
pause
goto MAIN_MENU

:: ========================================
:: 8. 顯示完整日誌
:: ========================================
:VIEW_LOGS
echo.
echo 📋 Git提交日誌
echo ========================================

echo [1] 簡潔日誌 (最近20次)
echo [2] 詳細日誌 (最近10次)
echo [3] 圖形化日誌
echo [4] 按作者篩選
echo [5] 按日期篩選
echo [6] 返回主選單
echo.
set /p log_choice="請選擇日誌類型: "

if "%log_choice%"=="1" (
    git log --oneline -20
)

if "%log_choice%"=="2" (
    git log -10 --pretty=format:"%%h - %%an, %%ar : %%s"
)

if "%log_choice%"=="3" (
    git log --graph --pretty=format:"%%C(yellow)%%h%%Creset %%C(blue)%%an%%Creset: %%s %%C(green)(%%cr)%%Creset" --abbrev-commit -15
)

if "%log_choice%"=="4" (
    set /p author="輸入作者名稱: "
    if not "!author!"=="" (
        git log --author="!author!" --oneline -10
    )
)

if "%log_choice%"=="5" (
    set /p since_date="輸入開始日期 (YYYY-MM-DD): "
    if not "!since_date!"=="" (
        git log --since="!since_date!" --oneline
    )
)

if "%log_choice%"=="6" goto MAIN_MENU

pause
goto VIEW_LOGS

:: ========================================
:: 9. 高級操作
:: ========================================
:ADVANCED_OPS
echo.
echo ⚙️  高級Git操作
echo ========================================

echo [1] 創建並推送到新遠程倉庫
echo [2] 變基操作 (Interactive Rebase)
echo [3] 儲藏更改 (Stash)
echo [4] 櫻桃挑選提交 (Cherry Pick)
echo [5] 子模組管理
echo [6] 返回主選單
echo.
set /p advanced_choice="請選擇操作: "

if "%advanced_choice%"=="1" (
    set /p remote_url="輸入遠程倉庫URL: "
    if not "!remote_url!"=="" (
        git remote add origin !remote_url!
        git push -u origin main
        echo ✅ 遠程倉庫設置並推送完成
    )
)

if "%advanced_choice%"=="2" (
    set /p rebase_count="輸入要變基的提交數量: "
    if not "!rebase_count!"=="" (
        git rebase -i HEAD~!rebase_count!
    )
)

if "%advanced_choice%"=="3" (
    echo 當前儲藏:
    git stash list
    echo.
    echo [a] 儲藏當前更改
    echo [b] 應用最新儲藏
    echo [c] 刪除儲藏
    set /p stash_op="選擇操作: "
    
    if "!stash_op!"=="a" (
        set /p stash_msg="儲藏描述: "
        git stash save "!stash_msg!"
        echo ✅ 更改已儲藏
    )
    
    if "!stash_op!"=="b" (
        git stash pop
        echo ✅ 儲藏已應用
    )
    
    if "!stash_op!"=="c" (
        git stash clear
        echo ✅ 所有儲藏已清除
    )
)

if "%advanced_choice%"=="4" (
    echo 最近的提交:
    git log --oneline -10
    echo.
    set /p cherry_hash="輸入要櫻桃挑選的提交哈希: "
    if not "!cherry_hash!"=="" (
        git cherry-pick !cherry_hash!
        echo ✅ 櫻桃挑選完成
    )
)

if "%advanced_choice%"=="5" (
    echo [a] 添加子模組
    echo [b] 更新子模組
    echo [c] 初始化子模組
    set /p submodule_op="選擇操作: "
    
    if "!submodule_op!"=="a" (
        set /p submodule_url="子模組URL: "
        set /p submodule_path="子模組路徑: "
        git submodule add !submodule_url! !submodule_path!
    )
    
    if "!submodule_op!"=="b" (
        git submodule update --remote
    )
    
    if "!submodule_op!"=="c" (
        git submodule init && git submodule update
    )
)

if "%advanced_choice%"=="6" goto MAIN_MENU

pause
goto ADVANCED_OPS

:: ========================================
:: 錯誤處理
:: ========================================
:INVALID_CHOICE
color 0C
echo ❌ 無效的選擇，請重新輸入
timeout /t 2 >nul
color 0A
goto MAIN_MENU

:ERROR_HANDLER
color 0C
echo.
echo ❌ 操作失敗，錯誤代碼: %errorlevel%
echo 📝 請檢查Git狀態並手動解決問題
echo.
pause
color 0A
goto MAIN_MENU

:: ========================================
:: 退出程序
:: ========================================
:EXIT
echo.
echo 👋 感謝使用AI衣櫃AutoGit工具!
echo 🚀 祝您開發愉快!
echo.
timeout /t 2 >nul
exit /b 0