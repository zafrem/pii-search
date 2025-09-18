# PII Search

A comprehensive multi-language PII (Personally Identifiable Information) detection system with advanced parallel processing, cascaded detection models, and integrated data generation capabilities for training and testing.

## 🎯 Overview

This application provides multiple PII detection approaches with advanced AI models:

1. **Basic Search** - Rule-based pattern matching using regex patterns
2. **Cascaded AI Detection** - Parallel processing with Multilingual BERT → DeBERTa v3 → Ollama LLM
3. **Simple Learning Engine** - Adaptive ML with continuous training capabilities
4. **Data Generation System** - Faker-based PII data generation for training and testing

### ✨ Key Features

- **🧠 Advanced AI Detection** - Parallel processing with cascaded models and adaptive learning
- **🌍 Multi-language Support** - 12+ languages with locale-aware generation
- **🎯 Data Generation & Training** - Faker-based generation with 23+ data types
- **🏷️ Comprehensive Labeling System** - Interactive annotation with multiple export formats
- **🔒 Privacy & Security** - Local processing with GDPR/HIPAA ready architecture
- **🚀 Production Features** - Docker containerization with health monitoring

## 🚀 Demo

![Demo](./image/PII_Search.gif)

## 📋 Documentation

- [Installation Guide](doc/installation.md) - Setup instructions and deployment options
- [Usage Guide](doc/usage.md) - Detection workflows and supported PII types
- [Architecture](doc/architecture.md) - System components and technology stack
- [API Documentation](doc/api.md) - Complete API reference and examples
- [Development Guide](doc/development.md) - Contributing and development setup
- [Security & Privacy](doc/security.md) - Security features and compliance
- [Troubleshooting](doc/troubleshooting.md) - Common issues and solutions

## 🚀 Quick Start

**Prerequisites**: Node.js 16+, Python 3.8+, Ollama

```bash
# Clone and install
git clone <repository-url>
cd pii-search
npm install

# Setup engines
cd deep_search_engine && ./setup.sh && cd ..
cd context_search_engine && ./setup.sh && cd ..

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b

# Start application
npm run dev
```

**Access**: Frontend at http://localhost:3000

For complete setup instructions, see [Installation Guide](doc/installation.md).

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** for local LLM capabilities
- **Hugging Face** for transformer models
- **React** and **TypeScript** communities
- **scikit-learn** for ML algorithms
- **FastAPI** for Python web framework

---

For detailed learning and training processes, see [PII_LEARNING_MANUAL.md](PII_LEARNING_MANUAL.md).