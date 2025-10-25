# MetaPulse Railway Deployment Guide

This guide covers deploying the MetaPulse AI Bot system to Railway as a single deployment that includes both the web app and bot services.

## Architecture Overview

- **Combined Deployment**: Both web app and bot services deployed together on Railway
- **Web App**: Next.js application served on Railway's main port
- **Bot Services**: Node.js bot with workers running internally
- **Database**: Supabase (PostgreSQL) - optional for production data
- **Cache**: Upstash Redis - optional for production caching
- **External APIs**: PumpPortal, DexScreener, Groq AI

## Prerequisites (Optional for Production)

1. **Supabase Project** (Optional - app works with fallback data)
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migrations in `supabase/migrations/`
   - Get your project URL and anon key

2. **Upstash Redis** (Optional - app works without caching)
   - Create a Redis database at [upstash.com](https://upstash.com)
   - Get your Redis URL and token

3. **API Keys**
   - Groq API key for AI processing
   - PumpPortal API key for real-time data
   - Telegram Bot Token for notifications

## Railway Deployment

### 1. Connect Repository
1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Railway will detect the Dockerfile automatically

### 2. Environment Variables
Add these environment variables in Railway dashboard:

**Required Variables:**
```bash
# Core Configuration
NODE_ENV=production
PORT=3000
BOT_PORT=3001
WEB_PORT=3000

# AI Services
GROQ_API_KEY=your_groq_api_key

# Data Sources
PUMPPORTAL_API_KEY=your_pumpportal_api_key
DEXSCREENER_BASE_URL=https://api.dexscreener.com

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Rate Limiting
DEXSCREENER_RATE_LIMIT=60
CACHE_TTL_MINUTES=5
```

**Optional Variables (for production database):**
```bash
# Supabase (Optional - app uses fallback data if not provided)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Redis (Optional - app works without caching)
REDIS_URL=your_upstash_redis_url
REDIS_TOKEN=your_upstash_redis_token

# OpenAI (Optional alternative to Groq)
OPENAI_API_KEY=your_openai_api_key
```

### 3. Deploy
Railway will automatically build using the Dockerfile and deploy your application.

## How It Works

### Fallback Data System
The application is designed to work immediately without requiring database setup:

1. **Development Mode**: Uses realistic sample data for all endpoints
2. **Production Mode**: 
   - If database credentials are provided → uses real data
   - If database credentials are missing → uses fallback data
   - Graceful degradation ensures the app always works

### Service Architecture
- **Web App**: Runs on Railway's main PORT (for healthcheck)
- **Bot Services**: Runs internally on BOT_PORT
- **Health Check**: Railway monitors the web app at `/`
- **Data Flow**: Bot ingests data → Database → Web app displays

## Post-Deployment Setup

### 1. Database Setup (Optional)
If using Supabase, run the migrations:
```sql
-- Run the files in supabase/migrations/ in order
-- 001_initial_schema.sql
-- 002_prompt_schema_update.sql
```

### 2. Verify Services
1. **Web App**: Visit your Railway URL and check the dashboard
2. **Bot Services**: Check Railway logs for successful startup
3. **APIs**: Test `/api/tokens/trending` and `/api/market/stats`

### 3. Test Integration
1. The web app should load immediately with sample data
2. If database is configured, real data will replace sample data
3. Bot should start ingesting data (if configured)

## Monitoring and Maintenance

### Health Checks
- **Railway**: Uses `/` endpoint for health monitoring
- **Logs**: Application logs available in Railway dashboard

### Scaling
- **Railway**: Configure replicas in railway.json if needed
- **Auto-scaling**: Railway handles traffic spikes automatically

## Troubleshooting

### Common Issues

1. **App Shows Sample Data**
   - This is normal if database is not configured
   - Add Supabase credentials to use real data
   - Check logs for "Using fallback data" messages

2. **Build Failures**
   - Check pnpm-lock.yaml is committed
   - Verify all dependencies are listed in package.json
   - Check Dockerfile syntax

3. **Service Startup Issues**
   - Check Railway logs for startup errors
   - Verify required environment variables are set
   - Check port configuration (PORT=3000)

### Development vs Production

**Development:**
- Uses sample data by default
- No database required
- Fast setup and testing

**Production:**
- Add database credentials for real data
- Configure Redis for caching
- Set up monitoring and alerts

## Security Notes

1. **Never commit secrets** to the repository
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor usage** to prevent unexpected charges
5. **Set up alerts** for service failures

## Cost Optimization

1. **Railway**: Free tier covers development and small production
2. **Supabase**: Free tier includes generous limits
3. **Upstash**: Free tier suitable for development
4. **Fallback Data**: Reduces external API costs during development

## Updates and Maintenance

1. **Automated Deployments**: Railway supports automatic deployments on git push
2. **Database Migrations**: Run new migrations manually in Supabase (if using)
3. **Dependency Updates**: Update package.json and redeploy
4. **Monitoring**: Set up alerts for service health and performance

## Quick Start Checklist

- [ ] Connect repository to Railway
- [ ] Set required environment variables (GROQ_API_KEY, PUMPPORTAL_API_KEY, etc.)
- [ ] Deploy and verify web app loads
- [ ] (Optional) Add Supabase credentials for real data
- [ ] (Optional) Add Redis credentials for caching
- [ ] Monitor logs and performance