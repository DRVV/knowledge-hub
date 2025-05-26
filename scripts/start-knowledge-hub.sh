#!/bin/bash

# Start Knowledge Hub on port 3000
echo "🚀 Starting Knowledge Hub on port 3000..."
echo "📊 Langfuse dashboard: http://localhost:3100"
echo "🌐 Knowledge Hub: http://localhost:3000"
echo ""

# Navigate to knowledge-hub directory if not already there
cd "$(dirname "$0")/.."

# Start the development server on port 3000
npm run dev
