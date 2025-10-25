# MetaPulse AI Bot - Project Overview

## 🎯 What is this site/app?

**MetaPulse AI Bot ($PULSEAI)** is an **AI-powered market intelligence system for cryptocurrency** built on Solana blockchain.

### Main Purpose
A crypto trading intelligence tool that provides:

- **Real-time scanning** of all new tokens on Pump.fun and Raydium
- **AI-powered detection** of emerging trends and narratives ("metas") before they go mainstream
- **Automatic categorization** of tokens into categories (AI Agents, Frogs, Gaming, Celebrities, etc.)
- **Telegram alerts** with hourly digests of top-performing metas and tokens
- **Buy signals** - filters tokens based on liquidity, market cap, volume, and transaction criteria

**In essence:** A crypto trading assistant with AI-powered early detection and market intelligence.

---

## 🛠️ Tech Stack

### **Frontend (Web App)**
- **Next.js** - React framework for the website
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### **Backend (Bot)**
- **Node.js** + **TypeScript** - Runtime environment
- **Telegram Bot API** (node-telegram-bot-api) - Bot interactions
- **WebSocket client** - PumpPortal API integration
- **Groq API** - AI analysis with llama-3.1-8b-instant model

### **Data Sources**
- **PumpPortal API** - Real-time token data via WebSocket
- **DexScreener API** - Market data for buy signals
- **IPFS** - Decentralized logo hosting with fallback

### **Infrastructure & Deployment**
- **Monorepo structure** with PNPM workspaces
- **Docker** + **Docker Compose** - Containerization
- **Railway** - Cloud hosting platform
- **Nginx** - Reverse proxy and web server

### **Project Architecture**
```
metapulse/
├── apps/
│   ├── bot/          # Telegram bot + WebSocket client (Node.js/TypeScript)
│   └── web/          # Next.js website (React/TypeScript/Tailwind)
├── packages/
│   ├── core/         # Shared utilities & AI logic (scoring, risk analysis)
│   └── pumpportal/   # PumpPortal WebSocket client library
└── docker-compose.yml
```

---

## 📊 Key Features

### 🤖 AI-Powered Token Analysis
- Real-time scanning of new tokens on Pump.fun
- AI categorization using Groq API (llama-3.1-8b-instant)
- Smart fallback to heuristic analysis when rate limited
- Dynamic meta detection for emerging trends

### 📱 Telegram Bot
- Interactive menu with `/start` command
- Hourly digests with top tokens and metas
- Live status and website links
- Real-time notifications for new tokens
- Buy signals with advanced filtering

### 🌐 Professional Website
- Live DEX interface with real-time token updates
- AI activity feed showing background processing
- Token categorization and filtering
- Modern cyber-themed UI/UX
- Multiple pages: Home, Feed, Metas, Tokens, Presale

### 💎 Buy Signals System
Filters tokens based on:
- Liquidity ≥ $80,000
- Market Cap: $1M - $80M
- Pair Age ≤ 60 hours
- Transactions ≥ 3,000
- Sorted by volume

---

## 🚀 Project Type

**Category:** AI Tool + Market Intelligence Dashboard + Crypto Trading Assistant

**Target Audience:** Crypto traders and investors looking for early-stage token opportunities

**Business Model:** 
- Token-based ecosystem ($PULSEAI)
- Presale for fundraising
- Future paid services using PULSEAI tokens
- Revenue sharing (70% to buybacks)

---

## 🔧 Development Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14+ |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Animations | Framer Motion |
| Bot Framework | node-telegram-bot-api |
| AI Service | Groq API (Llama-3.1) |
| Data Source | PumpPortal WebSocket, DexScreener API |
| Package Manager | PNPM (workspace monorepo) |
| Containerization | Docker + Docker Compose |
| Hosting | Railway |
| Node Version | ≥18.0.0 |

---

## 📈 Current Status

- ✅ Basic token scanning
- ✅ AI categorization with smart fallback
- ✅ Telegram bot with interactive menu
- ✅ Professional website with live feed
- ✅ Buy signals system
- ✅ Hourly digest notifications

**Live Website:** https://www.metapulse.tech

---

*Last Updated: October 2024*

