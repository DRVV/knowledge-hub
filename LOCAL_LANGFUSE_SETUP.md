# Local Langfuse Setup Guide

This guide explains how to run Knowledge Hub with a local Langfuse instance for LLMOps observability.

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│  Knowledge Hub      │────│  Local Langfuse     │
│  localhost:3000     │    │  localhost:3100     │
└─────────────────────┘    └─────────────────────┘
           │                           │
           │                           │
        ┌─────────────────────┐    ┌─────────────────────┐
        │    MongoDB          │    │   PostgreSQL        │
        │  localhost:27017    │    │  localhost:5432     │
        └─────────────────────┘    └─────────────────────┘
```

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed
- MongoDB running locally

## Quick Start

### 1. Start Langfuse (Already Done)
You've already started Langfuse with `docker-compose up -d`.

### 2. Check Status
```bash
./scripts/check-langfuse.sh
```

### 3. Start Knowledge Hub
```bash
# Option 1: Using shell script
./scripts/start-knowledge-hub.sh

# Option 2: Direct command
npm run dev
```

## Access Points

- **Langfuse Dashboard**: http://localhost:3100
- **Knowledge Hub**: http://localhost:3000
- **MongoDB**: localhost:27017

## Environment Configuration

Your `.env.local` is configured with:
```bash
NEXTAUTH_URL=http://localhost:3000  # Knowledge Hub port
LANGFUSE_HOST=http://localhost:3100 # Local Langfuse
LANGFUSE_SECRET_KEY=sk-lf-...       # Your generated key
LANGFUSE_PUBLIC_KEY=pk-lf-...       # Your generated key
```

## Available Scripts

### NPM Scripts
- `npm run dev` - Start Knowledge Hub on port 3000
- `npm run start` - Start production build on port 3000

### Shell Scripts
- `./scripts/check-langfuse.sh` - Check Langfuse status and configuration
- `./scripts/start-knowledge-hub.sh` - Start Knowledge Hub with helpful info

## Features Available

With local Langfuse, you get:

1. **📊 Trace Logging**: Every graph generation is logged
2. **💬 Prompt Management**: Centralized prompt templates
3. **👍 User Feedback**: Ratings and comments collection
4. **📈 Analytics**: Token usage, performance metrics
5. **🔍 Debugging**: Detailed request/response logging

## Testing the Integration

1. Start Knowledge Hub on port 3000
2. Upload a CSV file and generate a graph
3. Check Langfuse dashboard at http://localhost:3100 for traces
4. Use the "Rate this generation" button to test feedback collection
5. View prompt templates in Langfuse dashboard

## Troubleshooting

### Port Conflicts
- Langfuse runs on port 3100
- Knowledge Hub runs on port 3000
- If you have conflicts, check what's running: `lsof -i :3000` or `lsof -i :3100`

### Langfuse Not Starting
```bash
# Check Docker status
docker-compose ps

# View logs
docker-compose logs langfuse-web

# Restart if needed
docker-compose restart
```

### Knowledge Hub Connection Issues
```bash
# Check environment variables
cat .env.local | grep LANGFUSE

# Test connection
curl http://localhost:3100

# Check if Knowledge Hub can connect
npm run dev
```

## Development Workflow

1. Start Langfuse: `docker-compose up -d`
2. Check status: `./scripts/check-langfuse.sh`
3. Start Knowledge Hub: `npm run dev`
4. Develop and test with full observability
5. Monitor traces in Langfuse dashboard

## Data Privacy

All data stays local:
- Traces stored in local PostgreSQL
- No data sent to Langfuse cloud
- Full control over your observability data
