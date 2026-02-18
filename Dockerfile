# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (bcrypt, better-sqlite3)
RUN apk add --no-cache python3 make g++

# Enable corepack for Yarn 4
RUN corepack enable && corepack prepare yarn@4 --activate

# Copy package files
COPY package.json yarn.lock ./

# Configure Yarn to use node_modules and install deps
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN yarn config set nodeLinker node-modules && \
    yarn config set enableGlobalCache false && \
    yarn install

# Copy source code
COPY tsconfig.json build.js ./
COPY src ./src

# Build the application
RUN yarn build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy files with correct ownership (avoids slow chown -R)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Expose the port
EXPOSE 3000

USER nodejs

# Start the application
CMD ["node", "dist/index.js"]
