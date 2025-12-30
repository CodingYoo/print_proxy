@echo off
REM Quick Build Script - Print Proxy Windows EXE
REM Usage: Double-click or run from command line

echo.
echo ========================================
echo   Print Proxy Quick Build Tool
echo ========================================
echo.

REM Build frontend first
echo [1/2] Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Frontend build completed.
echo.

REM Build Python EXE
echo [2/2] Building Python EXE...
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
