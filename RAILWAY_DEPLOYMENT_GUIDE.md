# 🚀 MetaPulse Railway Deployment Guide

## 📋 **Prerequisites**

Before deploying to Railway, ensure you have:
- ✅ Railway account ([railway.app](https://railway.app))
- ✅ GitHub repository connected
- ✅ All API keys and tokens ready
- ✅ Local development working

## 🔧 **Step 1: Environment Variables Setup**

### **Required Environment Variables for Railway:**

Copy these from your local `.env` file to Railway dashboard:

```bash
# PumpPortal API
PUMPPORTAL_API_KEY=f9bp6kujct33gvutd9r3jtua894prbundt3pcbuf6hj46kb2chcpaub36hk5ekhnagt3jdut6gvkjdbeedx6en9m8tv4rgbj91c34nad9ttk4uv3a0up2nkje9x6ccjj98qpcr9newyku8hpq2kkddcw6wxa69574pwkuerex6q6m398t74mj27b1q4rmjbd4nmgn1jedkkuf8

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8015893980:AAFgT0AXJB38LvVe6FTcO9Y2UxOywAZsoxc
TELEGRAM_CHAT_ID=-1002920631699

# AI Configuration
GEMINI_API_KEY=AIzaSyBcKWU3O_0gnaT96lG7fCGg2a_okYLW-to
GEMINI_MODEL=gemini-2.0-flash-exp

# Port Configuration
BOT_PORT=3001

# Bot Behavior Settings
DIGEST_CRON=0 * * * *
ROLLUP_WINDOW_SEC=3600
TOP_TOKENS_LIMIT=10
TOP_METAS_LIMIT=5
MIN_UNIQUE_BUYERS=4
MAX_PRICE_IMPACT_01=25
MIN_BUYER_SELLER_RATIO=1.1

# Scheduler Configuration (Optional)
TELEGRAM_CHAT_IDS=-1002920631699
```

### **🎯 New Scheduler Features:**
The updated bot now includes automated scheduling:
- **Hourly buy signals** - AI analysis every hour
- **Market analysis** - Every 4 hours
- **Performance tracking** - Daily at 8 AM UTC
- **Weekly summaries** - Sundays at 10 AM UTC

## 🚀 **Step 2: Railway Deployment**

### **Option A: Deploy via Railway Dashboard**

1. **Connect Repository:**
   ```bash
   # Go to railway.app
   # Click "New Project"
   # Select "Deploy from GitHub repo"
   # Choose your MetaPulse repository
   ```

2. **Configure Build:**
   - Railway will auto-detect the `Dockerfile`
   - Build command: `pnpm build`
   - Start command: `node start-both.js`

3. **Add Environment Variables:**
   - Go to **Variables** tab
   - Add all variables from the list above
   - Click **Deploy**

### **Option B: Deploy via Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set PUMPPORTAL_API_KEY="your_key_here"
railway variables set TELEGRAM_BOT_TOKEN="your_token_here"
railway variables set TELEGRAM_CHAT_ID="your_chat_id_here"
railway variables set GEMINI_API_KEY="your_gemini_key_here"
railway variables set GEMINI_MODEL="gemini-2.0-flash-exp"
railway variables set BOT_PORT="3001"
railway variables set DIGEST_CRON="0 * * * *"
railway variables set ROLLUP_WINDOW_SEC="3600"
railway variables set TOP_TOKENS_LIMIT="10"
railway variables set TOP_METAS_LIMIT="5"
railway variables set MIN_UNIQUE_BUYERS="4"
railway variables set MAX_PRICE_IMPACT_01="25"
railway variables set MIN_BUYER_SELLER_RATIO="1.1"
railway variables set TELEGRAM_CHAT_IDS="-1002920631699"

# Deploy
railway up
```

## 📊 **Step 3: Verify Deployment**

### **Health Check Endpoints:**
- **Main Health**: `https://your-app.railway.app/api/health`
- **Bot Status**: `https://your-app.railway.app/api/status`
- **Live Feed**: `https://your-app.railway.app/api/feed`

### **Expected Services:**
1. **Web App** (Port 3000) - Main website and API
2. **Bot Service** (Port 3001) - Telegram bot and scheduler
3. **Scheduler** - Automated tasks running in background

## 🔍 **Step 4: Monitor Deployment**

### **Railway Dashboard Monitoring:**
- **Deployments** - View build and deploy logs
- **Metrics** - CPU, memory, and network usage
- **Logs** - Real-time application logs
- **Variables** - Manage environment variables

### **Application Logs to Watch For:**
```bash
✅ Connected to PumpPortal WebSocket
🚀 Starting MetaPulse Signal Scheduler...
✅ Hourly buy signals scheduled
✅ Market analysis scheduled (every 4 hours)
✅ Performance tracking scheduled (daily 8 AM UTC)
✅ Weekly summary scheduled (Sundays 10 AM UTC)
🎯 All scheduled tasks are now active
🤖 Bot HTTP server running on port 3001
```

## 🛠️ **Step 5: Post-Deployment Configuration**

### **Telegram Bot Setup:**
1. **Test bot commands** in your Telegram chat
2. **Verify scheduled messages** are working
3. **Check buy signals** are being generated

### **Web App Verification:**
1. **Visit your Railway URL**
2. **Check live feed** at `/feed`
3. **Verify analytics** at `/analytics`
4. **Test token scanner** at `/tokens`

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Build Failures:**
```bash
# Check package.json scripts
# Verify all dependencies are listed
# Check for TypeScript errors
```

#### **Runtime Errors:**
```bash
# Check environment variables are set
# Verify API keys are valid
# Check Railway logs for specific errors
```

#### **Bot Not Responding:**
```bash
# Verify TELEGRAM_BOT_TOKEN is correct
# Check TELEGRAM_CHAT_ID is valid
# Ensure bot is added to the chat
# Check PumpPortal API key is active
```

#### **Scheduler Not Working:**
```bash
# Verify TELEGRAM_CHAT_IDS is set
# Check cron expressions are valid
# Monitor logs for scheduler messages
```

## 📈 **Step 6: Scaling and Optimization**

### **Railway Pro Features:**
- **Custom domains** - Use your own domain
- **Increased resources** - More CPU and memory
- **Priority support** - Faster response times
- **Advanced metrics** - Detailed performance data

### **Performance Monitoring:**
- **Response times** - API endpoint performance
- **Memory usage** - Bot and web app memory
- **WebSocket connections** - PumpPortal connectivity
- **Scheduler execution** - Automated task performance

## 🎯 **Success Indicators**

Your deployment is successful when you see:
- ✅ **Web app** accessible at Railway URL
- ✅ **Bot responding** to Telegram commands
- ✅ **Scheduler running** automated tasks
- ✅ **Live feed** updating with new tokens
- ✅ **Health checks** returning 200 OK
- ✅ **No errors** in Railway logs

## 🔗 **Useful Links**

- **Railway Dashboard**: [railway.app/dashboard](https://railway.app/dashboard)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **MetaPulse Telegram**: [t.me/metapulseai](https://t.me/metapulseai)
- **Support**: Check Railway logs and GitHub issues

---

**🚀 Ready to deploy? Follow these steps and your MetaPulse AI Bot will be live on Railway with full scheduling capabilities!**