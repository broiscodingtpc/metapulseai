# MetaPulse AI Bot - Railway Production
# Fixed infinite postinstall loop issue
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

# Install dependencies (no postinstall loop)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages and applications
RUN pnpm build

# Expose ports for bot (3000) and web (5174)
EXPOSE 3000 5174

# Start both services in background
CMD ["sh", "-c", "pnpm start:bot & pnpm start:web"]
