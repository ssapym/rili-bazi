#!/bin/bash

# 八字排盘系统服务器启动脚本
# 记录 PID 文件以实现精确进程管理

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# PID 文件路径
PID_FILE="$SCRIPT_DIR/server.pid"

# 从配置文件读取端口号
read_port_from_config() {
    local config_file="$SCRIPT_DIR/src/config/default.js"
    if [ -f "$config_file" ]; then
        # 使用 node 解析 JS 文件获取端口
        node -e "
            const config = require('$config_file');
            console.log(config.server?.port || 8000);
        " 2>/dev/null
    else
        echo "8000"
    fi
}

TARGET_PORT=$(read_port_from_config)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  八字排盘系统 - 服务器启动脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}读取配置...${NC}"
echo -e "   端口: $TARGET_PORT"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js${NC}"
    echo "安装地址: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}[1/5]${NC} 检查 Node.js 版本..."
node --version
echo ""

# 检查服务是否已经在运行
check_and_stop_existing() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            # 验证进程是否在正确端口
            if command -v lsof &> /dev/null && lsof -i :${TARGET_PORT} -a -p "$OLD_PID" &>/dev/null; then
                echo -e "${YELLOW}[2/5]${NC} 检测到现有进程正在运行 (PID: $OLD_PID, 端口: $TARGET_PORT)"
                echo -e "${YELLOW}   正在停止现有进程...${NC}"
                kill "$OLD_PID" 2>/dev/null
                
                # 等待进程完全停止
                local count=0
                while kill -0 "$OLD_PID" 2>/dev/null && [ $count -lt 30 ]; do
                    sleep 0.5
                    count=$((count + 1))
                done
                
                # 强制杀死如果还在运行
                if kill -0 "$OLD_PID" 2>/dev/null; then
                    echo -e "${YELLOW}   正在强制终止...${NC}"
                    kill -9 "$OLD_PID" 2>/dev/null
                    sleep 0.5
                fi
                
                echo -e "${GREEN}   已停止现有进程${NC}"
            fi
        fi
        rm -f "$PID_FILE"
    fi
}

check_and_stop_existing

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[3/5]${NC} 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: 依赖安装失败${NC}"
        exit 1
    fi
    echo ""
else
    echo -e "${GREEN}[3/5]${NC} 依赖已安装"
    echo ""
fi

echo -e "${GREEN}[4/5]${NC} 启动服务器..."
echo ""

# 启动服务器并记录 PID
npm start &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

echo -e "${GREEN}   服务器已启动 (PID: $SERVER_PID)${NC}"
echo -e "${GREEN}   PID 文件: $PID_FILE${NC}"
echo -e "${GREEN}   端口: $TARGET_PORT${NC}"
echo ""

# 等待服务器启动
sleep 2

# 检查服务是否正常运行
if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo -e "${GREEN}[5/5]${NC} 服务器运行正常"
    echo ""
    echo -e "${BLUE}服务已成功启动！${NC}"
    echo -e "${BLUE}访问地址: http://localhost:${TARGET_PORT}${NC}"
    echo ""
    echo -e "停止服务: ${YELLOW}./stop.command${NC}"
    echo -e "重启服务: ${YELLOW}./restart.command${NC}"
    echo ""
else
    echo -e "${RED}错误: 服务器启动失败${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
