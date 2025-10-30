@echo off
chcp 65001 >nul
echo ====================================
echo 启动开发环境
echo ====================================
echo.

REM 检查后端是否已在运行
netstat -ano | findstr :8569 >nul
if %errorlevel% equ 0 (
    echo [后端] 检测到8569端口已被占用，跳过后端启动
) else (
    echo [后端] 启动后端服务...
    start "PrintProxy Backend" cmd /k "cd /d %~dp0 && python -m uvicorn app.main:app --host 127.0.0.1 --port 8569 --reload"
    timeout /t 3 >nul
)

echo.
echo [前端] 准备启动前端开发服务器...
echo.
cd frontend\frontend-app

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo [前端] 检测到依赖未安装，正在安装...
    call npm install
)

echo.
echo [前端] 启动前端开发服务器...
start "PrintProxy Frontend" cmd /k "cd /d %~dp0frontend\frontend-app && npm run dev"

echo.
echo ====================================
echo 开发环境启动完成！
echo ====================================
echo.
echo 后端地址: http://localhost:8569
echo 前端地址: http://localhost:3000
echo API文档: http://localhost:8569/docs
echo.
echo 默认管理员账户：
echo   用户名: admin
echo   密码: admin123
echo.
echo 按任意键退出...
pause >nul

