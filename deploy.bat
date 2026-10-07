@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

echo ============================================
echo  部署脚本：同步 dist -^> docs 并推送到 GitHub
echo ============================================
echo.

REM 检查 docs 和 dist 目录
if not exist "docs" (
    echo [错误] 未找到 docs 目录
    pause
    exit /b 1
)
if not exist "dist" (
    echo [错误] 未找到 dist 目录，请先执行 npm run build
    pause
    exit /b 1
)

REM 1. 删除 docs 下除 CNAME 外的所有内容
echo [1/4] 清理 docs 目录（保留 CNAME）...
if exist "docs\CNAME" (
    move /y "docs\CNAME" "%temp%\CNAME_deploy.tmp" >nul
)
for /d %%i in ("docs\*") do rd /s /q "%%i"
del /q /f "docs\*"
if exist "%temp%\CNAME_deploy.tmp" (
    move /y "%temp%\CNAME_deploy.tmp" "docs\CNAME" >nul
)
echo 已清理 docs 目录，CNAME 已保留
echo.

REM 2. 复制 dist 下所有文件到 docs
echo [2/4] 复制 dist 到 docs ...
xcopy "dist\*" "docs\" /e /i /y /q
echo 复制完成
echo.

REM 3. Git 提交
echo [3/4] 提交到 Git ...
git add -A
if errorlevel 1 (
    echo [错误] git add 失败
    pause
    exit /b 1
)

git diff --cached --quiet
if errorlevel 1 (
    git commit -m "deploy: update docs from dist"
    if errorlevel 1 (
        echo [错误] git commit 失败
        pause
        exit /b 1
    )
) else (
    echo 没有变更需要提交
)
echo.

REM 4. 推送到远程
echo [4/4] 推送到 GitHub ...
git push origin
if errorlevel 1 (
    echo [错误] git push 失败，请检查网络或权限
    pause
    exit /b 1
)

echo.
echo ============================================
echo  部署完成！
echo ============================================
pause
