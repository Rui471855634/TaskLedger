@echo off
setlocal

REM Run from repo/release zip root (two levels up from this file)
cd /d "%~dp0\..\.."

if "%HOST%"=="" set HOST=127.0.0.1
if "%PORT%"=="" set PORT=4173

REM Prefer native Windows exe (no Node required)
if exist "taskledger-server.exe" (
  echo [TaskLedger] Starting server at http://%HOST%:%PORT%
  echo [TaskLedger] Close this window to stop the server.
  echo.
  "taskledger-server.exe" -host "%HOST%" -port %PORT% -dir "dist"
  exit /b %errorlevel%
)

where node >nul 2>nul
if errorlevel 1 (
  echo [TaskLedger] Node.js is not installed or not in PATH.
  echo Install Node.js 16+ and try again.
  pause
  exit /b 1
)

echo [TaskLedger] Starting server at http://%HOST%:%PORT%
echo [TaskLedger] Close this window to stop the server.
echo.

node tools\serve-dist.mjs

