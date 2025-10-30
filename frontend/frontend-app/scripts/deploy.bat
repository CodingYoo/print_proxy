@echo off
REM ============================================================================
REM 前端应用部署脚本 (Windows)
REM 用于自动化构建和部署流程
REM ============================================================================

setlocal enabledelayedexpansion

echo [INFO] 开始部署流程...
echo ================================

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js 未安装
    exit /b 1
)

REM 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm 未安装
    exit /b 1
)

echo [INFO] 所有必需工具已安装

REM 清理旧的构建产物
echo [INFO] 清理旧的构建产物...
call npm run clean
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 清理失败
    exit /b 1
)
echo [INFO] 清理完成

REM 安装依赖
echo [INFO] 安装依赖...
call npm ci
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 依赖安装失败
    exit /b 1
)
echo [INFO] 依赖安装完成

REM 运行代码检查
echo [INFO] 运行代码检查...
call npm run lint
if %ERRORLEVEL% neq 0 (
    echo [WARN] 代码检查发现问题，但继续构建...
)
echo [INFO] 代码检查完成

REM 运行类型检查
echo [INFO] 运行类型检查...
call npm run type-check
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 类型检查失败
    exit /b 1
)
echo [INFO] 类型检查通过

REM 构建生产版本
echo [INFO] 构建生产版本...
call npm run build:prod
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 构建失败
    exit /b 1
)
echo [INFO] 构建完成

REM 检查构建产物
echo [INFO] 检查构建产物...
if not exist "dist" (
    echo [ERROR] 构建目录不存在
    exit /b 1
)

if not exist "dist\index.html" (
    echo [ERROR] index.html 不存在
    exit /b 1
)

echo [INFO] 构建产物检查通过

echo ================================
echo [INFO] 部署流程完成！
echo [INFO] 构建产物位于: dist\

endlocal
