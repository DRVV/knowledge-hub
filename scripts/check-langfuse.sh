#!/bin/bash

echo "🔍 Checking Langfuse status..."

# Check if Langfuse is running on port 3100
if curl -s http://localhost:3100 > /dev/null 2>&1; then
    echo "✅ Langfuse is running at http://localhost:3100"
else
    echo "❌ Langfuse is not running on port 3100"
    echo "💡 Make sure you have run 'docker-compose up -d' in your Langfuse directory"
    exit 1
fi

# Check if Knowledge Hub environment is configured
cd "$(dirname "$0")/.."
if [[ -f ".env.local" ]]; then
    if grep -q "LANGFUSE_SECRET_KEY=sk-lf-" ".env.local" && grep -q "LANGFUSE_HOST=http://localhost:3100" ".env.local"; then
        echo "✅ Environment variables are configured"
    else
        echo "⚠️  Check your .env.local file for proper Langfuse configuration"
    fi
else
    echo "❌ .env.local file not found"
fi

echo ""
echo "🌐 Access points:"
echo "   Langfuse Dashboard: http://localhost:3100"
echo "   Knowledge Hub: http://localhost:3000"
