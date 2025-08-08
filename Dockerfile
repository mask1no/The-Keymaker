# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# copy the minimal runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["pnpm","start"]
# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile || pnpm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm","run","verify"]

# Multi-stage build for production
FROM node:20-alpine AS deps
# Install dependencies only when needed
RUN apk add --no-cache libc6-compat python3 python3-dev py3-setuptools make g++ eudev-dev
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Skip postinstall during build as it requires the scripts directory
RUN npm ci --legacy-peer-deps --ignore-scripts
# Rebuild native dependencies
RUN npm rebuild sqlite3

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Skip database initialization during build - will be done at runtime
# RUN mkdir -p /app/data && npm run db:init

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image with nginx
FROM nginx:1.27-alpine AS runner

# Install Node.js, sqlite, curl, tini and chromium dependencies for Puppeteer
RUN apk add --no-cache nodejs npm sqlite curl tini chromium nss freetype harfbuzz ca-certificates ttf-freefont

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# Configure Puppeteer to use system chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy nginx config
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public* ./public/

# Copy scripts and database files
COPY --chown=nextjs:nodejs init.sql ./init.sql
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Create data directory with correct permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Create PID file directory
RUN mkdir -p /var/run && chown -R nextjs:nodejs /var/run

# Handle SIGTERM for graceful shutdown
STOPSIGNAL SIGTERM

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Enhanced health check with multiple endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -fs http://localhost:3000/api/health || \
      curl -fs http://localhost/health || \
      exit 1

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./docker-entrypoint.sh"]