# MetaPulse AI Bot - Railway Production
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm@9.10.0

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

# Expose port for web app (Railway will use this for healthcheck)
EXPOSE 3000

# Start both services
WORKDIR /app
CMD ["node", "start-both.js"]
