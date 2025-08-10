#!/bin/bash

# PII Search Production Start Script
echo "Starting PII Search in production mode..."

# Check if built files exist
if [ ! -d "backend/dist" ]; then
    echo "Backend not built. Building..."
    cd backend && npm run build && cd ..
fi

if [ ! -d "frontend/build" ]; then
    echo "Frontend not built. Building..."
    cd frontend && npm run build && cd ..
fi

# Start production servers
echo "Starting production backend server..."
cd backend && npm start &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo "Frontend build files are in frontend/build/ - serve with your web server"
echo "To stop the backend, run: kill $BACKEND_PID"

# Save PID for stop script
echo $BACKEND_PID > .backend.pid

echo "PII Search production backend started successfully!"