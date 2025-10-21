# MetaPulse AI Bot - Railway Production
# This is the main Dockerfile for Railway deployment
# No .env file copying - uses Railway environment variables
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies
RUN pnpm install

# Build all packages and applications
RUN pnpm build

# Expose ports for bot (3000) and web (5174)
EXPOSE 3000 5174

# Start both services in background
CMD ["sh", "-c", "pnpm start:bot & pnpm start:web"]
