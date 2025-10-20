#!/bin/bash

# MetaPulse AI Bot - Railway Start Script
echo "🚀 Starting MetaPulse AI Bot on Railway..."

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages
echo "🔨 Building packages..."
pnpm build

# Start both services
echo "🚀 Starting services..."
pnpm start
