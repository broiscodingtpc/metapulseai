#!/bin/bash

# MetaPulse AI Bot - GitHub Setup Script
echo "🔒 Setting up secure GitHub repository..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Check if .env exists and warn user
if [ -f ".env" ]; then
    echo "⚠️  WARNING: .env file detected!"
    echo "   Make sure to add your API keys to Railway dashboard"
    echo "   The .env file will NOT be committed to GitHub"
fi

# Add all files
echo "📁 Adding files to git..."
git add .

# Check what will be committed
echo "📋 Files to be committed:"
git status --porcelain

# Commit
echo "💾 Committing changes..."
git commit -m "Initial commit - MetaPulse AI Bot

- Telegram bot with AI-powered token analysis
- Next.js website with live DEX interface
- Rate limiting and smart fallbacks
- Railway deployment ready
- Secure environment variable handling"

echo "✅ Repository ready for GitHub!"
echo ""
echo "🚀 Next steps:"
echo "1. Create GitHub repository"
echo "2. Add remote: git remote add origin <your-repo-url>"
echo "3. Push: git push -u origin main"
echo "4. Deploy on Railway with environment variables"
echo ""
echo "📖 See github-setup.md for detailed instructions"
