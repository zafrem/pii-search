#!/bin/bash

echo "🏷️  Starting PII Data Labeling System..."

# Function to handle cleanup
cleanup() {
    echo "🔄 Shutting down labeling system..."
    pkill -f "python.*start.py" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Create log directory
mkdir -p logs

echo "🐍 Starting backend (Port 8002)..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Backend virtual environment not found. Please run setup.sh first."
    exit 1
fi

source venv/bin/activate

# Check if required packages are installed
python -c "import uvicorn, fastapi, sqlalchemy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Required backend packages not found. Installing..."
    pip install -r requirements.txt
fi

python start.py > ../logs/labeling_backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/labeling_backend.pid

# Wait for backend to start and verify it's running
sleep 5
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check logs/labeling_backend.log"
    exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"
cd ..

echo "⚛️  Starting frontend (Port 3002)..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Frontend dependencies not found. Installing..."
    npm install
fi

# Check if react-scripts is properly installed
if ! npm list react-scripts > /dev/null 2>&1; then
    echo "❌ react-scripts not found. Installing..."
    npm install react-scripts@5.0.1
fi

BROWSER=none npm start > ../logs/labeling_frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/labeling_frontend.pid

# Wait for frontend to start and verify it's running
sleep 10
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check logs/labeling_frontend.log"
    exit 1
fi

echo "✅ Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "🌟 PII Data Labeling System started!"
echo "   Frontend: http://localhost:3002"
echo "   Backend API: http://localhost:8002"
echo "   API Docs: http://localhost:8002/docs"
echo ""
echo "📋 Logs available in logs/ directory"
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
