@echo off
REM Build Installer Script - Print Proxy Windows Installer
REM Usage: Double-click or run from command line
REM Note: Requires NSIS to be installed and in PATH
REM Output: dist\PrintProxySetup_1.0.0.exe

echo.
echo ========================================
echo   Print Proxy Installer Builder
echo ========================================
echo.

REM Check if EXE exists
if not exist "dist\PrintProxy.exe" (
    echo ERROR: PrintProxy.exe not found!
    echo.
    echo Please run build.bat first to create the EXE
    echo.
    pause
    exit /b 1
)

REM Build installer
powershell -ExecutionPolicy Bypass -File scripts\windows\build_installer.ps1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installer created: dist\PrintProxySetup_1.0.0.exe
    echo Installer build completed! Press any key to exit...
    pause >nul
) else (
    echo.
    echo Installer build failed! Press any key to exit...
    pause >nul
    exit /b 1
)
