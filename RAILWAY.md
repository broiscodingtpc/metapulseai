# Railway Deployment Guide

## Environment Variables

Configure these in your Railway dashboard:

```bash
# Required - PumpPortal API
PUMPPORTAL_API_KEY="your_pumpportal_api_key"

# Required - Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_telegram_chat_id"

# Required - AI Analysis
GROQ_API_KEY="your_groq_api_key"
GROQ_MODEL="llama-3.1-8b-instant"

# Optional - Port Configuration
# Railway automatically sets PORT=3000 for healthcheck
# BOT_PORT is internal and defaults to 3001
BOT_PORT="3001"
```

## Railway Configuration

Railway will automatically:
1. Detect the `Dockerfile` and build your app
2. Expose port 3000 for the web app (healthcheck)
3. Run the `start-both.js` script which starts:
   - Web app on port 3000 (Railway's PORT)
   - Bot internally on port 3001

## Healthcheck

Railway checks `/api/health` on port 3000 (web app).

The healthcheck endpoint returns:
```json
{
  "status": "healthy",
  "message": "MetaPulse AI Web App is running",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 12345.67,
  "services": {
    "web": "active",
    "bot": "starting"
  },
  "environment": "production",
  "version": "1.0.0",
  "ready": true
}
```

## Deployment Process

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update deployment"
   git push origin main
   ```

2. **Railway Auto-Deploy**:
   - Railway detects the push
   - Builds the Docker image
   - Runs healthcheck on `/api/health`
   - Deploys if healthcheck passes

## Troubleshooting

### Bot keeps restarting
- Check Railway logs for errors
- Verify all environment variables are set
- Check if ports are configured correctly

### Healthcheck fails
- The web app must start on Railway's `PORT` (automatically set to 3000)
- Check `/api/health` endpoint responds with 200 status
- Increase healthcheck timeout in `railway.json` if needed

### Rate Limiting
- Free tier: 500K tokens/day
- Bot automatically falls back to heuristic analysis
- Consider upgrading to Developer tier for production

## Logs

View logs in Railway dashboard:
- Click on your service
- Go to "Deployments"
- Click on latest deployment
- View logs in real-time

## Graceful Shutdown

The bot handles Railway restarts gracefully:
- Listens for SIGTERM/SIGINT signals
- Closes server connections
- Completes pending requests
- Exits cleanly after 10s timeout

## Performance

- Bot processes ~100-200 tokens/hour
- Memory usage: ~150-200 MB
- CPU usage: <5% average
- Healthcheck response: <100ms

## Support

For issues:
1. Check Railway logs
2. Verify environment variables
3. Test healthcheck locally: `http://localhost:3000/api/health`
4. Check GitHub repository for latest updates

