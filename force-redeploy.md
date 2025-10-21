# Force Railway Redeploy

## Manual Steps to Force Redeploy:

### Option 1: Railway Dashboard
1. Go to Railway dashboard
2. Find your MetaPulse project
3. Click on the service
4. Go to "Deployments" tab
5. Click "Redeploy" button

### Option 2: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Force redeploy
railway up
```

### Option 3: GitHub Webhook
1. Go to Railway project settings
2. Check "Auto Deploy" is enabled
3. Verify GitHub webhook is connected
4. Make a small commit to trigger redeploy

## Current Status:
- Dockerfile: ✅ Updated with timestamp
- Railway.json: ✅ Configured for DOCKERFILE builder
- Environment: ✅ Variables set in Railway dashboard
- Git: ✅ Latest commit pushed

## Next Steps:
1. Check Railway dashboard for deployment status
2. If no auto-deploy, trigger manual redeploy
3. Monitor build logs for any errors
