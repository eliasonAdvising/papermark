# Use Node.js 20 Alpine as base image (matching Papermark requirements >= 18.17.0)
FROM node:20-alpine AS base

# Install system dependencies required for Papermark
RUN apk add --no-cache libc6-compat python3 py3-pip

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies) for build
RUN NODE_ENV=development npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments from Railway
ARG DATABASE_URL
ARG POSTGRES_PRISMA_URL
ARG POSTGRES_PRISMA_URL_NON_POOLING
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_WEBHOOK_BASE_HOST
ARG NEXT_PUBLIC_APP_BASE_HOST

# Set environment variables from build args
ENV DATABASE_URL=${DATABASE_URL}
ENV POSTGRES_PRISMA_URL=${POSTGRES_PRISMA_URL:-${DATABASE_URL}}
ENV POSTGRES_PRISMA_URL_NON_POOLING=${POSTGRES_PRISMA_URL_NON_POOLING:-${DATABASE_URL}}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-https://papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-https://papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_WEBHOOK_BASE_HOST=${NEXT_PUBLIC_WEBHOOK_BASE_HOST:-papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_APP_BASE_HOST=${NEXT_PUBLIC_APP_BASE_HOST:-papermark-production-bbd1.up.railway.app}

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

# Deploy database migrations if database URL is available
RUN if [ -n "$DATABASE_URL" ] || [ -n "$POSTGRES_PRISMA_URL" ]; then \
        echo "Running database migrations..."; \
        npx prisma migrate deploy; \
    else \
        echo "Skipping database migration - no database URL provided"; \
    fi

# Build the application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client and schema (needed for runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Fix permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
