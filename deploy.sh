#!/bin/bash

# MetaPulse AI Bot Deployment Script
echo "🚀 Deploying MetaPulse AI Bot..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create logs directory
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.production .env
    echo "⚠️  Please edit .env file with your actual API keys before running the application."
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "✅ MetaPulse AI Bot is now running!"
echo ""
echo "📊 Services:"
echo "   - Bot API: http://localhost:3000"
echo "   - Website: http://localhost:5174"
echo "   - Status: docker-compose ps"
echo "   - Logs: docker-compose logs -f"
echo ""
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
