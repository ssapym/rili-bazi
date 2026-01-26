#!/bin/bash

# 八字排盘系统服务器重启脚本
# 复用 start.command 和 stop.command

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================"
echo "  八字排盘系统 - 服务器重启脚本"
echo "========================================"
echo ""

# 步骤 1: 停止服务
echo "[1/2] 停止现有服务..."
echo ""
"$SCRIPT_DIR/stop.command"
STOP_RESULT=$?

if [ $STOP_RESULT -ne 0 ]; then
    echo "停止服务时出现错误，但继续尝试启动..."
fi

echo ""
echo "[2/2] 启动服务..."
echo ""
"$SCRIPT_DIR/start.command"
START_RESULT=$?

if [ $START_RESULT -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  服务重启成功！"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "  错误: 服务启动失败"
    echo "========================================"
    exit 1
fi
