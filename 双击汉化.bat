@echo off
chcp 65001 >nul
echo ==============================================
echo Antigravity 2.x Chinese Patch (Node.js version)
echo ==============================================
echo.
echo Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [Error] Node.js is not found! Please ensure Node.js is installed and added to PATH.
    echo You can download it from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Starting the patch process...
echo (Note: This will close the Antigravity application temporarily)
echo.
cd /d "%~dp0"
node patch.js

echo.
echo Patch finished. Press any key to exit...
pause >nul
