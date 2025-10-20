# Railway Deployment Guide

## 🚀 Deploy MetaPulse AI Bot on Railway

### 1. Prepare Repository
```bash
# Make sure .env is in .gitignore
echo ".env" >> .gitignore

# Commit all changes
git add .
git commit -m "Initial commit - MetaPulse AI Bot"
git push origin main
```

### 2. Railway Setup

#### Option A: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new

# Link to existing project
railway link

# Deploy
railway up
```

#### Option B: Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the repository
4. Railway will auto-detect the configuration

### 3. Environment Variables

In Railway dashboard, add these environment variables:

```bash
# Required
PUMPPORTAL_API_KEY=your_actual_api_key
TELEGRAM_BOT_TOKEN=your_actual_bot_token
TELEGRAM_CHAT_ID=your_actual_chat_id

# Optional (for AI features)
GROQ_API_KEY=your_actual_groq_key
GROQ_MODEL=llama-3.1-8b-instant

# Server settings
BOT_PORT=3000
WEB_PORT=5174
NODE_ENV=production
```

### 4. Railway Configuration

Railway will automatically:
- Detect `package.json` and `pnpm-workspace.yaml`
- Install dependencies with `pnpm install`
- Build the project
- Start both services

### 5. Custom Domains (Optional)

In Railway dashboard:
1. Go to Settings → Domains
2. Add custom domain
3. Configure DNS records

### 6. Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Health checks**: Automatic service monitoring
- **Deployments**: Automatic deployments on git push

### 7. Scaling

Railway supports:
- **Horizontal scaling**: Multiple instances
- **Vertical scaling**: More CPU/memory
- **Auto-scaling**: Based on traffic

### 8. Environment Management

```bash
# Development
railway environment development

# Production
railway environment production

# View logs
railway logs

# Connect to service
railway shell
```

### 9. Troubleshooting

#### Common Issues:
1. **Build fails**: Check `package.json` and dependencies
2. **Port conflicts**: Ensure ports are correctly configured
3. **Environment variables**: Verify all required vars are set
4. **Memory issues**: Increase memory allocation in Railway

#### Debug Commands:
```bash
# View logs
railway logs --follow

# Check environment
railway variables

# Restart service
railway redeploy
```

### 10. Production Checklist

- [ ] All environment variables set
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Performance monitoring active

### 11. Maintenance

#### Regular Tasks:
- Monitor logs for errors
- Check rate limit usage
- Update dependencies
- Backup configuration
- Monitor performance metrics

#### Updates:
```bash
# Pull latest changes
git pull origin main

# Railway auto-deploys on push
git push origin main
```

---

**Railway makes deployment simple and automatic!** 🚀
