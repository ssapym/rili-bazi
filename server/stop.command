#!/bin/bash

# 八字排盘系统服务器停止脚本
# 通过精确查找端口上的进程来停止服务

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/server.pid"

read_port_from_config() {
    local config_file="$SCRIPT_DIR/src/config/default.js"
    if [ -f "$config_file" ]; then
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
echo -e "${GREEN}  八字排盘系统 - 服务器停止脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}读取配置...${NC}"
echo -e "   端口: $TARGET_PORT"
echo ""

is_process_running() {
    local pid=$1
    [ -z "$pid" ] && return 1
    kill -0 "$pid" 2>/dev/null
}

is_node_server_process() {
    local pid=$1
    [ -z "$pid" ] && return 1
    if ! is_process_running "$pid"; then
        return 1
    fi
    
    local cmd=$(ps -p "$pid" -o command= 2>/dev/null)
    if [[ "$cmd" == *"node"* && "$cmd" == *"server.js"* ]]; then
        return 0
    fi
    
    local cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | tail -1 | sed 's/^n//')
    if [[ "$cwd" == *"server"* ]]; then
        return 0
    fi
    
    return 1
}

find_node_server_pid() {
    local port=$1
    if command -v lsof &>/dev/null; then
        local pid=$(lsof -ti:${port} -c node 2>/dev/null | head -1)
        if [ -n "$pid" ] && is_node_server_process "$pid"; then
            echo "$pid"
        fi
    fi
}

find_all_node_server_processes() {
    pgrep -f "node.*server\.js" 2>/dev/null | while read pid; do
        if [ -n "$pid" ]; then
            ps -p "$pid" -o pid,command= 2>/dev/null || true
        fi
    done
}

echo -e "${GREEN}[1/3]${NC} 查找服务进程..."

TARGET_PID=""

if [ -f "$PID_FILE" ]; then
    SAVED_PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$SAVED_PID" ]; then
        if is_node_server_process "$SAVED_PID"; then
            echo -e "${GREEN}   通过 PID 文件找到 node server.js 进程 (PID: $SAVED_PID)${NC}"
            TARGET_PID="$SAVED_PID"
        elif is_process_running "$SAVED_PID"; then
            echo -e "${YELLOW}   PID 文件中的进程 (PID: $SAVED_PID) 不是 node server.js 进程${NC}"
            echo -e "${YELLOW}   正在查找其他 node server.js 进程...${NC}"
        fi
    fi
fi

if [ -z "$TARGET_PID" ]; then
    PORT_PID=$(find_node_server_pid "$TARGET_PORT")
    if [ -n "$PORT_PID" ]; then
        echo -e "${GREEN}   通过端口查找找到 node server.js 进程 (PID: $PORT_PID, 端口: $TARGET_PORT)${NC}"
        TARGET_PID="$PORT_PID"
    fi
fi

if [ -z "$TARGET_PID" ]; then
    echo ""
    echo -e "${YELLOW}未找到运行中的八字服务器进程${NC}"
    echo ""
    echo -e "${YELLOW}当前系统中所有的 node server.js 进程：${NC}"
    all_processes=$(find_all_node_server_processes)
    if [ -n "$all_processes" ]; then
        echo "$all_processes"
    else
        echo -e "${YELLOW}   （无）${NC}"
    fi
    exit 0
fi

echo ""
echo -e "${GREEN}[2/3]${NC} 正在停止服务 (PID: $TARGET_PID)..."

kill -TERM "$TARGET_PID" 2>/dev/null

COUNT=0
MAX_WAIT=30

while [ $COUNT -lt $MAX_WAIT ]; do
    if ! is_process_running "$TARGET_PID"; then
        echo -e "${GREEN}   服务已停止${NC}"
        rm -f "$PID_FILE"
        break
    fi
    sleep 0.5
    COUNT=$((COUNT + 1))
done

if is_process_running "$TARGET_PID"; then
    echo -e "${YELLOW}   进程未响应，发送强制终止...${NC}"
    kill -KILL "$TARGET_PID" 2>/dev/null
    sleep 0.5
    
    if ! is_process_running "$TARGET_PID"; then
        echo -e "${GREEN}   服务已强制停止${NC}"
        rm -f "$PID_FILE"
    else
        echo -e "${RED}   错误：无法停止进程${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}服务已成功停止！${NC}"
echo ""
echo -e "启动服务: ${YELLOW}./start.command${NC}"
echo -e "重启服务: ${YELLOW}./restart.command${NC}"
echo ""
