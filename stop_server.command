#!/bin/bash
PORT=8000
PID=$(lsof -t -i:$PORT)
if [ -z "$PID" ]; then
    echo "没有发现运行在端口 $PORT 的进程 (No process found on port $PORT)"
else
    echo "正在关闭端口 $PORT 上的进程 (Killing process $PID on port $PORT)..."
    kill $PID
    echo "已关闭 (Closed)."
fi
# 保持窗口打开几秒钟以便用户看到结果
sleep 3
