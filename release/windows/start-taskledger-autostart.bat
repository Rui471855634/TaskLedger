@echo off
setlocal

REM Run from repo/release zip root (two levels up from this file)
cd /d "%~dp0\..\.."

if "%HOST%"=="" set HOST=127.0.0.1
if "%PORT%"=="" set PORT=4173

REM Prefer native Windows exe (no Node required)
if exist "taskledger-server.exe" (
  start "" /min "taskledger-server.exe" -host "%HOST%" -port %PORT% -dir "dist"
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
  exit /b 1
)

REM Start minimized so users don't see a console window on login.
start "" /min node tools\serve-dist.mjs

