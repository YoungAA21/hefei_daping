@echo off
chcp 65001
cd /d "%~dp0"
title 检测监控大屏服务器 - 4173

echo ====================================
echo    Vue 项目自动部署脚本
echo    部署配置: .env.production（同机后端默认 127.0.0.1:7804）
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
echo  内网访问: 请使用下方 Network 显示的服务器内网地址
echo ==============================
echo.
echo API代理配置:
echo   /LineInfo, /api, /ngimages
echo   实际后端目标将在启动时显示；修改配置后请重启服务
echo.
echo 按 Ctrl+C 停止服务器
echo ====================================
echo.

call npm run preview

pause