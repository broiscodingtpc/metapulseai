# Multi-stage build for MetaPulse AI Bot
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bot/package.json ./apps/bot/
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/pumpportal/package.json ./packages/pumpportal/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bot/package.json ./apps/bot/
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/pumpportal/package.json ./packages/pumpportal/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built applications
COPY --from=base /app/apps/bot/dist ./apps/bot/dist
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/packages/core/dist ./packages/core/dist
COPY --from=base /app/packages/pumpportal/dist ./packages/pumpportal/dist

# Copy environment file
COPY .env ./

# Expose ports
EXPOSE 3000 5174

# Start both services
CMD ["sh", "-c", "pnpm dev:bot & pnpm dev:web"]
