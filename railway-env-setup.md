# Railway Environment Variables Setup

## 🚀 **Railway Deployment - Environment Variables**

### 📋 **Required Environment Variables**

Copy these variables from your local `.env` file and add them to Railway:

#### **🤖 Bot Configuration:**
```
PUMPPORTAL_API_KEY=your_pumpportal_api_key_here
```

#### **📱 Telegram Configuration:**
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

#### **🧠 AI Configuration:**
```
GROQ_API_KEY=your_groq_api_key_here
```

#### **🌐 Port Configuration:**
```
BOT_PORT=3000
WEB_PORT=5174
```

### 🔧 **How to Add Environment Variables in Railway:**

#### **Step 1: Access Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Login to your account
3. Select your MetaPulse project

#### **Step 2: Add Environment Variables**
1. Click on your service (bot or web)
2. Go to **Variables** tab
3. Click **+ New Variable**
4. Add each variable one by one:

| Variable Name | Value |
|---------------|-------|
| `PUMPPORTAL_API_KEY` | `your_pumpportal_api_key_here` |
| `TELEGRAM_BOT_TOKEN` | `your_telegram_bot_token_here` |
| `TELEGRAM_CHAT_ID` | `your_telegram_chat_id_here` |
| `GROQ_API_KEY` | `your_groq_api_key_here` |
| `BOT_PORT` | `3000` |
| `WEB_PORT` | `5174` |

#### **Step 3: Deploy**
1. After adding all variables, click **Deploy**
2. Railway will automatically build and deploy your application
3. Your services will be available at the provided Railway URLs

### 🔒 **Security Notes:**

#### **✅ Best Practices:**
- **Never commit** `.env` files to Git
- **Use Railway's** environment variable system
- **Rotate keys** regularly for security
- **Monitor usage** of API keys

#### **⚠️ Important:**
- These are **real API keys** - keep them secure
- **Don't share** these values publicly
- **Railway encrypts** environment variables automatically

### 🌐 **Expected URLs After Deployment:**

#### **Bot Service:**
- **Status**: `https://your-project.railway.app/status`
- **Feed**: `https://your-project.railway.app/feed.json`

#### **Web Service:**
- **Website**: `https://your-project.railway.app`
- **Live Feed**: `https://your-project.railway.app/feed`
- **Token Scanner**: `https://your-project.railway.app/tokens`

### 🚨 **Troubleshooting:**

#### **If Deployment Fails:**
1. **Check variables** - ensure all are added correctly
2. **Check logs** - Railway provides detailed build logs
3. **Verify keys** - ensure API keys are valid and active
4. **Check ports** - ensure ports 3000 and 5174 are available

#### **If Bot Doesn't Connect:**
1. **Verify Telegram token** - test with BotFather
2. **Check chat ID** - ensure bot is added to the chat
3. **Verify PumpPortal key** - ensure API key is active
4. **Check Groq API** - ensure key has sufficient quota

### 📊 **Monitoring:**

#### **Railway Dashboard:**
- **Deployments** - View deployment history
- **Logs** - Real-time application logs
- **Metrics** - CPU, memory, and network usage
- **Variables** - Manage environment variables

#### **Health Checks:**
- **Bot Status**: `GET /status` should return `{"status":"active"}`
- **Web Status**: Website should load without errors
- **API Status**: `/api/feed` should return token data

---

## 🎯 **Quick Setup Checklist:**

- [ ] Copy all environment variables from local `.env`
- [ ] Add variables to Railway dashboard
- [ ] Deploy both bot and web services
- [ ] Test bot status endpoint
- [ ] Test website functionality
- [ ] Verify Telegram bot responds
- [ ] Check live data feed

**Your MetaPulse AI Bot will be live on Railway! 🚀**
