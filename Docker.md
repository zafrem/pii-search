# Docker Deployment Guide

This guide explains how to run the PII Search using Docker containers.

## Prerequisites

- Docker (version 20.10+)
- Docker Compose v2
- At least 4GB RAM available for containers
- At least 10GB disk space (for Ollama models)

## Quick Start

### Docker Mode (Default)
```bash
# Start all services with Docker
./start.sh

# Or explicitly:
./start.sh --docker

# Include labeling services:
./start.sh --with-labeling
```

### Native Mode
```bash
# Start services natively (original behavior)
./start.sh -n
# or
./start.sh --native
```

## Service Endpoints

When running in Docker mode:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main web interface |
| Backend API | http://localhost:3001 | REST API server |
| Deep Search Engine | http://localhost:8000 | ML classification service |
| Context Search Engine | http://localhost:8001 | LLM validation service |
| Ollama | http://localhost:11434 | Local LLM service |
| Labeling Frontend | http://localhost:3002 | Data labeling interface (optional) |
| Labeling Backend | http://localhost:8002 | Labeling API (optional) |

## Docker Commands

### Basic Operations
```bash
# Build and start all services
docker compose up --build

# Start in detached mode
docker compose up -d

# View logs
docker compose logs
docker compose logs [service-name]

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### With Labeling Services
```bash
# Start with labeling services
docker compose --profile labeling up --build

# Stop labeling services
docker compose --profile labeling down
```

### Individual Services
```bash
# Start only specific services
docker compose up ollama deep-search context-search

# Rebuild specific service
docker compose up --build frontend

# Scale a service (if needed)
docker compose up --scale backend=2
```

## Environment Variables

Create a `.env` file in the project root to customize settings:

```env
# Ollama Configuration
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b

# Service Ports (change if needed)
FRONTEND_PORT=3000
BACKEND_PORT=3001
DEEP_SEARCH_PORT=8000
CONTEXT_SEARCH_PORT=8001
OLLAMA_PORT=11434

# Optional: Labeling Services
LABELING_FRONTEND_PORT=3002
LABELING_BACKEND_PORT=8002
```

## Volumes and Data Persistence

The Docker setup includes persistent volumes for:

- `ollama_data`: Stores Ollama models and configuration
- `deep_search_models`: Stores trained ML models
- `labeling_data`: Stores labeling database and exports

### Managing Volumes
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect pii-search_ollama_data

# Backup volumes
docker run --rm -v pii-search_ollama_data:/data -v $(pwd):/backup alpine tar czf /backup/ollama_backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v pii-search_ollama_data:/data -v $(pwd):/backup alpine tar xzf /backup/ollama_backup.tar.gz -C /data
```

## Troubleshooting

### Common Issues

**1. Ollama models not downloading:**
```bash
# Enter ollama container and pull models manually
docker compose exec ollama ollama pull llama3.2:3b
docker compose exec ollama ollama pull llama3.2:1b
```

**2. Services not starting:**
```bash
# Check logs
docker compose logs ollama
docker compose logs deep-search
docker compose logs context-search

# Restart specific service
docker compose restart ollama
```

**3. Port conflicts:**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8001

# Kill conflicting processes or change ports in docker-compose.yml
```

**4. Memory issues:**
```bash
# Check Docker resources
docker system df

# Clean up unused resources
docker system prune -a
docker volume prune
```

### Performance Tuning

**For production deployment:**

1. **Resource limits** - Add to docker-compose.yml:
```yaml
services:
  ollama:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

2. **Use multi-stage builds** - Reduce image sizes
3. **Enable Docker BuildKit** - Faster builds:
```bash
export DOCKER_BUILDKIT=1
```

### Development vs Production

**Development (default):**
- Services restart automatically
- Logs visible in console
- Hot reloading enabled

**Production:**
```bash
# Use production compose file
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or set environment
NODE_ENV=production docker compose up -d
```

## Health Checks

All services include health checks. Monitor with:

```bash
# Check service health
docker compose ps

# View health check logs
docker inspect $(docker compose ps -q ollama) | jq '.[0].State.Health'
```

## Security Considerations

1. **Network isolation**: Services communicate through Docker network
2. **No root privileges**: Containers run as non-root users where possible
3. **Secrets management**: Use Docker secrets in production
4. **Firewall**: Only expose necessary ports externally

## Migration from Native to Docker

1. **Stop native services**: `./stop.sh -n`
2. **Export data** (if needed): 
   - Copy models from `deep_search_engine/models/`
   - Export labeling data from `deep_search_labeling/database/`
3. **Start Docker**: `./start.sh`
4. **Import data**: Copy to Docker volumes as needed

## Monitoring

For production monitoring, consider adding:

- Prometheus metrics
- Log aggregation (ELK/Loki)
- Health monitoring (Grafana)
- Alert manager

Example monitoring stack can be added via additional compose file.