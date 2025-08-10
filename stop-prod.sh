#!/bin/bash

# PII Search Production Stop Script
echo "Stopping PII Search production servers..."

# Check if PID file exists and stop backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm .backend.pid
        echo "Backend server stopped."
    else
        echo "Backend server not running (PID file exists but process not found)."
        rm .backend.pid
    fi
else
    echo "No PID file found. Attempting to stop any running backend processes..."
    # Kill any node processes running the production server
    pkill -f "node dist/server.js" 2>/dev/null || echo "No backend processes found"
fi

echo "PII Search production servers stopped."