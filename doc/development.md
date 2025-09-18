# Development Guide

## Project Structure

```
pii-search/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── backend/                 # Node.js backend
│   └── src/
│       ├── routes/         # API routes
│       ├── middleware/     # Express middleware
│       └── types/          # TypeScript types
├── engines/                # Pattern matching engines
│   ├── patterns/          # Language-specific patterns
│   ├── stage1/           # Rule-based engine
│   └── utils/            # Utility functions
├── deep_search_engine/     # ML-based detection
│   ├── src/              # Python source code
│   ├── models/           # Trained models
│   └── config/           # Configuration files
├── context_search_engine/  # LLM-based validation
│   ├── src/              # Python source code
│   └── config/           # Configuration files
└── deep_search_labeling/   # Data annotation system
    ├── frontend/         # Labeling interface
    └── backend/          # Annotation backend
```

## Available Scripts

```bash
# Development
npm run dev              # Start frontend + backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Building
npm run build           # Build all components
npm run build:frontend  # Build frontend
npm run build:backend   # Build backend

# Testing
npm run test           # Run all tests
npm run test:frontend  # Test frontend
npm run test:backend   # Test backend

# Linting
npm run lint           # Lint all code
npm run lint:frontend  # Lint frontend
npm run lint:backend   # Lint backend

# Docker
npm run docker:build   # Build Docker images
npm run docker:up      # Start containers
npm run docker:down    # Stop containers
```

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- **TypeScript** for all new JavaScript code
- **ESLint** configuration provided
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Maintain test coverage above 80%