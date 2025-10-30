@echo off
REM Quick Build Script - Print Proxy Windows EXE
REM Usage: Double-click or run from command line

echo.
echo ========================================
echo   Print Proxy Quick Build Tool
echo ========================================
echo.

REM Skip tests by default for faster build
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -SkipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build completed! Press any key to exit...
    pause >nul
) else (
    echo.
    echo Build failed! Press any key to exit...
    pause >nul
    exit /b 1
)
