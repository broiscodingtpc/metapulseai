# MetaPulse AI Bot - Railway Optimized
# Force rebuild - no .env copy needed
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN pnpm install

# Build all packages
RUN pnpm build

# Expose ports for bot and web
EXPOSE 3000 5174

# Start both services
CMD ["sh", "-c", "pnpm start:bot & pnpm start:web"]