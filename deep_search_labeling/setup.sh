#!/bin/bash

# PII Data Labeling System Setup Script

echo "🏷️  Setting up PII Data Labeling System..."

# Check if Node.js is available for frontend
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required for the frontend. Please install Node.js first."
    exit 1
fi

# Check if Python 3.8+ is available for backend
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8 or higher is required for the backend. Found: $python_version"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo "🐍 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing Python dependencies..."

# Special handling for macOS pyarrow issues
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS - installing dependencies with special handling..."
    
    # Try to install pyarrow with pre-built wheel first
    echo "Attempting to install pyarrow with pre-built wheel..."
    pip install --only-binary=pyarrow pyarrow || {
        echo "⚠️  Warning: Could not install pyarrow. Some features may be limited."
        echo "   You can still use the labeling system without pyarrow."
    }
fi

pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
python -c "
import sys
sys.path.insert(0, 'src')
from src.database.connection import init_db
init_db()
print('Database initialized successfully')
"

cd ..

# Setup Frontend
echo "⚛️  Setting up frontend..."
cd frontend

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

# Fix any potential vulnerabilities
echo "Auditing and fixing npm packages..."
npm audit fix --force 2>/dev/null || true

cd ..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p database exports logs

# Create environment files
echo "📝 Creating environment files..."

if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
# Database
DATABASE_URL=sqlite:///./data_labeling.db

# Security
SECRET_KEY=your-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Development
DEBUG=true
LOG_LEVEL=info
EOF
    echo "Created backend/.env file"
fi

# Create start scripts
echo "🚀 Creating start scripts..."

cat > start_labeling.sh << 'EOF'
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
source venv/bin/activate
python start.py > ../logs/labeling_backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/labeling_backend.pid
cd ..

# Wait for backend to start
sleep 3

echo "⚛️  Starting frontend (Port 3002)..."
cd frontend
BROWSER=none npm start > ../logs/labeling_frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/labeling_frontend.pid
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
EOF

chmod +x start_labeling.sh

cat > stop_labeling.sh << 'EOF'
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
EOF

chmod +x stop_labeling.sh

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the labeling system:"
echo "   ./start_labeling.sh"
echo ""
echo "🛑 To stop the labeling system:"
echo "   ./stop_labeling.sh"
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost:3002"
echo "   Backend API: http://localhost:8002/docs"
echo ""
echo "📚 See README.md for usage instructions"
