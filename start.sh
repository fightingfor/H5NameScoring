#!/bin/bash

# 保存进程ID的文件
PID_FILE=".service_pids"

# 检查端口是否被占用
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# 停止服务的函数
stop_services() {
    echo "Stopping services..."
    
    # 停止所有相关进程
    pkill -f "node.*vite"
    pkill -f "node.*server"
    
    # 确保端口被释放
    while check_port 5173 || check_port 3000; do
        echo "Waiting for ports to be released..."
        sleep 1
    done
    
    echo "All services stopped"
}

# 如果传入 stop 参数，则停止服务
if [ "$1" = "stop" ]; then
    stop_services
    exit 0
fi

# 检查端口是否被占用
if check_port 5173 || check_port 3000; then
    echo "Ports 5173 or 3000 are already in use. Please run './start.sh stop' first."
    exit 1
fi

# 检查是否已经安装了依赖
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# 启动后端服务
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

# 等待后端服务启动
echo "Waiting for backend to start..."
while ! check_port 3000; do
    sleep 1
done
echo "Backend is ready"

# 启动前端服务
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待前端服务启动
echo "Waiting for frontend to start..."
while ! check_port 5173; do
    sleep 1
done
echo "Frontend is ready"

# 保存进程ID
echo "$BACKEND_PID" > "$PID_FILE"
echo "$FRONTEND_PID" >> "$PID_FILE"

echo "Services are starting..."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
echo "To stop services, run: ./start.sh stop" 