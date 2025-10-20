# MetaPulse AI Bot — $PULSEAI

**Feel the pulse before the market does.

## 🚀 Quick Start

### Option 1: Railway Deployment (Recommended)
1. **Fork/Clone** this repository
2. **Deploy on Railway**: Connect GitHub repo to Railway
3. **Add Environment Variables** in Railway dashboard
4. **Access**: Railway provides public URLs automatically

### Option 2: Local Development
```bash
# Clone repository
git clone <repository-url>
cd metapulse

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Install dependencies
pnpm install

# Start services
pnpm dev:bot & pnpm dev:web
```

### Option 3: Docker Deployment
```bash
# Clone repository
git clone <repository-url>
cd metapulse

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Deploy with Docker
docker-compose up -d
```

### Access Services
- **Website**: http://localhost:5174 (or Railway URL)
- **Bot API**: http://localhost:3000 (or Railway URL)
- **Status**: `docker-compose ps` or Railway dashboard
- **Logs**: `docker-compose logs -f` or Railway logs

## 📊 Features

### 🤖 AI-Powered Token Analysis
- **Real-time scanning** of new tokens on Pump.fun
- **AI categorization** using Groq API (llama-3.1-8b-instant)
- **Smart fallback** to heuristic analysis when rate limited
- **Dynamic meta detection** for emerging trends
- **Rate limit management** with intelligent throttling

### 📱 Telegram Bot
- **Interactive menu** with `/start` command
- **Hourly digests** with top tokens and metas
- **Live status** and website links
- **Real-time notifications** for new tokens

### 🌐 Professional Website
- **Live DEX interface** with real-time token updates
- **AI activity feed** showing background processing
- **Token categorization** and filtering
- **Professional design** with modern UI/UX
- **IPFS-hosted logo** with automatic fallback

## 🔧 Configuration

### Environment Variables
```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
PUMPPORTAL_API_KEY=your_api_key

# Optional (for AI analysis)
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
```

### Rate Limits
- **Current**: Free tier (500K tokens/day, 14.4K requests/day)
- **Fallback**: Smart heuristic analysis when limits reached
- **Future**: Developer tier upgrade post-fundraising

## 🏗️ Architecture

### Monorepo Structure
```
metapulse/
├── apps/
│   ├── bot/          # Telegram bot + WebSocket client
│   └── web/          # Next.js website
├── packages/
│   ├── core/         # Shared utilities & AI logic
│   └── pumpportal/   # PumpPortal WebSocket client
└── docker-compose.yml
```

### Services
- **Bot Service**: Node.js + TypeScript
- **Web Service**: Next.js + React
- **AI Service**: Groq API integration
- **Data Service**: PumpPortal WebSocket

## 📈 Tokenomics

### $PULSEAI Distribution
- **30%** Presale
- **30%** Future Development (Locked)
- **20%** Volume Booster & Marketing
- **10%** Liquidity Pool
- **10%** Treasury

### Revenue Model
- **Paid services** with PULSEAI tokens
- **Revenue sharing** (70% to buybacks)
- **Premium features** for token holders
- **Sustainable growth** through utility

## 🛠️ Development

### Local Development
```bash
# Install dependencies
pnpm install

# Start bot
pnpm dev:bot

# Start website
pnpm dev:web
```

### Railway Deployment
1. **Connect Repository**: Link GitHub repo to Railway
2. **Environment Variables**: Add in Railway dashboard:
   ```bash
   PUMPPORTAL_API_KEY=your_key
   TELEGRAM_BOT_TOKEN=your_token
   TELEGRAM_CHAT_ID=your_chat_id
   GROQ_API_KEY=your_groq_key
   ```
3. **Auto-Deploy**: Railway deploys on every git push
4. **Monitor**: Check logs and metrics in Railway dashboard

### Docker Deployment
```bash
# Build and deploy
docker-compose up -d

# Monitor logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 API Endpoints

### Bot API (Port 3000)
- `GET /feed.json` - Live token data
- `GET /status` - Bot status

### Web API (Port 5174)
- `GET /api/feed` - Website feed data
- `GET /api/bot-status` - Bot connection status

## 🔒 Security

- **Environment variables** for sensitive data
- **Rate limiting** to prevent API abuse
- **CORS protection** for web requests
- **Docker isolation** for production

## 📞 Support

- **Website**: https://metapulse.ai
- **Telegram**: @MetaPulseBot
- **Documentation**: This README

## 🚀 Future Roadmap

### Phase 1: Current
- ✅ Basic token scanning
- ✅ AI categorization
- ✅ Telegram bot
- ✅ Website interface

### Phase 2: Post-Fundraising
- 🔄 Unlimited AI analysis
- 🔄 Advanced trading signals
- 🔄 Premium features
- 🔄 Mobile app

### Phase 3: Ecosystem
- 🔄 Revenue sharing
- 🔄 Partner integrations
- 🔄 Global expansion
- 🔄 Enterprise features

---

**MetaPulse AI Bot** — *Feel the pulse before the market does.*