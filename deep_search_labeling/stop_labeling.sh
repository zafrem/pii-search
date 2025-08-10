#!/bin/bash

echo "🛑 Stopping PII Data Labeling System..."

# Kill processes by PID files
if [ -f "logs/labeling_backend.pid" ]; then
    PID=$(cat logs/labeling_backend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "🔄 Stopping backend (PID: $PID)..."
        kill -TERM $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    fi
    rm -f logs/labeling_backend.pid
fi

if [ -f "logs/labeling_frontend.pid" ]; then
    PID=$(cat logs/labeling_frontend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "🔄 Stopping frontend (PID: $PID)..."
        kill -TERM $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    fi
    rm -f logs/labeling_frontend.pid
fi

# Cleanup any remaining processes
pkill -f "python.*start.py" 2>/dev/null || true
pkill -f "react-scripts start.*3002" 2>/dev/null || true
lsof -ti:8002 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

echo "✅ PII Data Labeling System stopped"
