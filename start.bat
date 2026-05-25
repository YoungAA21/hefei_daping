@echo off
chcp 65001
title Vue项目服务器 - 192.168.31.103:4173

echo ====================================
echo    Vue 项目自动部署脚本
echo    服务器IP: 192.168.31.103
echo ====================================
echo.

echo 1. 构建项目中...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo 错误：项目构建失败！
    echo 请检查错误信息后重试
    pause
    exit /b 1
)

echo.
echo 2. 启动预览服务器...
echo.
echo ========== 访问地址 ==========
echo  本地访问: http://localhost:4173
echo  内网访问: http://192.168.31.103:4173
echo ==============================
echo.
echo API代理配置:
echo   /LineInfo -> http://localhost:7803
echo.
echo 按 Ctrl+C 停止服务器
echo ====================================
echo.

npx vite preview --host 0.0.0.0 --port 4173

pause