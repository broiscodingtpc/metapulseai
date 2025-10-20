# GitHub Setup Guide

## 🔒 Secure Repository Setup

### 1. Create GitHub Repository
```bash
# Initialize git (if not already done)
git init

# Add remote origin
git remote add origin https://github.com/yourusername/metapulse-ai-bot.git

# Add all files
git add .

# Commit initial version
git commit -m "Initial commit - MetaPulse AI Bot"

# Push to GitHub
git push -u origin main
```

### 2. Security Checklist

#### ✅ Files to NEVER commit:
- `.env` - Contains API keys
- `.env.local` - Local environment
- `.env.production` - Production secrets
- `logs/` - Log files
- `node_modules/` - Dependencies

#### ✅ Files that ARE safe to commit:
- `.env.example` - Template with placeholder values
- `railway.json` - Railway configuration
- `nixpacks.toml` - Build configuration
- `Dockerfile` - Docker setup
- `docker-compose.yml` - Local development
- `README.md` - Documentation
- All source code files

### 3. Environment Variables Template

The `.env.example` file contains:
```bash
# Safe template - no real API keys
PUMPPORTAL_API_KEY=your_pumpportal_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Railway Integration

#### Option A: Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway auto-detects configuration

#### Option B: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to GitHub repo
railway link

# Deploy
railway up
```

### 5. Environment Variables in Railway

In Railway dashboard, add these variables:
```bash
PUMPPORTAL_API_KEY=your_actual_api_key
TELEGRAM_BOT_TOKEN=your_actual_bot_token
TELEGRAM_CHAT_ID=your_actual_chat_id
GROQ_API_KEY=your_actual_groq_key
NODE_ENV=production
```

### 6. GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

### 7. Repository Structure

```
metapulse-ai-bot/
├── .gitignore          # Excludes sensitive files
├── .env.example        # Template for environment variables
├── railway.json        # Railway configuration
├── nixpacks.toml       # Build configuration
├── railway-start.sh    # Start script
├── README.md           # Documentation
├── apps/
│   ├── bot/            # Telegram bot
│   └── web/            # Next.js website
├── packages/
│   ├── core/           # Shared utilities
│   └── pumpportal/     # WebSocket client
└── Dockerfile          # Docker configuration
```

### 8. Security Best Practices

#### ✅ DO:
- Use `.env.example` for templates
- Add `.env*` to `.gitignore`
- Use Railway's environment variables
- Keep API keys in Railway dashboard
- Use different keys for dev/prod

#### ❌ DON'T:
- Commit `.env` files
- Put API keys in code
- Share production keys
- Use same keys everywhere

### 9. Deployment Flow

```bash
# 1. Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# 2. Railway auto-deploys
# 3. Check Railway dashboard for status
# 4. Monitor logs in Railway
```

### 10. Monitoring

Railway provides:
- **Real-time logs**
- **Performance metrics**
- **Health checks**
- **Automatic restarts**
- **Custom domains**

---

**Your repository is now secure and ready for Railway deployment!** 🚀
