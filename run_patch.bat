@echo off
chcp 65001 >nul
title Antigravity 2.x Chinese Patcher Tool
echo ==================================================
echo         Antigravity 2.x Chinese Patcher Tool
echo ==================================================
echo.
echo Notice: Running this script will close Antigravity,
echo apply the Chinese patch, and restart it automatically.
echo.
echo Entering script directory...
cd /d "%~dp0"
echo Checking and installing dependencies...
call npm install --no-audit --no-fund
echo.
echo ==================================================
echo WARNING: Continuing will force close Antigravity.
echo Please save all your work before proceeding.
echo ==================================================
echo.
pause
echo.
echo Applying translation patch (running node patch.js)...
node patch.js
echo.
echo ==================================================
echo Patch applied! Antigravity should restart.
echo If it doesn't open, please start it manually.
echo ==================================================
echo.
pause
