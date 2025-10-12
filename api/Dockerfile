# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Copy only necessary files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY api ./api
COPY lib ./lib

ENV NODE_ENV=production
EXPOSE 3001

CMD ["pnpm","exec","tsx","api/server.ts"]


