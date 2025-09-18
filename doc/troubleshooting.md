# Troubleshooting

## Common Issues

### Installation Problems

#### Node.js Version Issues
```bash
# Check Node.js version
node --version  # Should be 16+

# Use nvm to manage versions
nvm install 16
nvm use 16
```

#### Python Dependencies
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install requirements
pip install -r requirements.txt
```

### Runtime Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # Replace with your port

# Kill process
kill -9 <PID>
```

#### Ollama Connection Issues
```bash
# Check Ollama status
ollama list

# Restart Ollama
ollama serve

# Pull required model
ollama pull llama3.2:3b
```

### Docker Issues

#### Container Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### Memory Issues
```bash
# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory
```

## Performance Optimization

### Frontend Optimization
- Enable React strict mode
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

### Backend Optimization
- Enable gzip compression
- Implement caching strategies
- Use connection pooling
- Monitor memory usage

### ML Engine Optimization
- Batch processing for multiple requests
- Model caching and preloading
- Async processing pipelines
- Resource monitoring

## Logging and Monitoring

### Log Locations
- **Frontend**: Browser console
- **Backend**: `backend/logs/`
- **Deep Search**: `deep_search_engine/logs/`
- **Context Search**: `context_search_engine/logs/`

### Monitoring Endpoints
- **Health Checks**: `/health` on each service
- **Metrics**: Prometheus-compatible endpoints
- **Status**: Service-specific status pages