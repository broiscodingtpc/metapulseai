# MetaPulse AI Bot - Railway Production
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bot/package.json ./apps/bot/
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/pumpportal/package.json ./packages/pumpportal/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages and applications
RUN pnpm build

# Set working directory to web app
WORKDIR /app/apps/web

# Expose port for web app
EXPOSE 3000

# Start web app
CMD ["node", "start-railway-final.js"]
