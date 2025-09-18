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
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_WEBHOOK_BASE_HOST
ARG NEXT_PUBLIC_APP_BASE_HOST

# Set environment variables from build args
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-https://papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-https://papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_WEBHOOK_BASE_HOST=${NEXT_PUBLIC_WEBHOOK_BASE_HOST:-papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_APP_BASE_HOST=${NEXT_PUBLIC_APP_BASE_HOST:-papermark-production-bbd1.up.railway.app}

# Set placeholder values for build-only requirements
ENV HANKO_API_KEY=placeholder-build-value
ENV NEXT_PUBLIC_HANKO_TENANT_ID=placeholder-build-value
ENV SLACK_CLIENT_ID=placeholder-build-value
ENV SLACK_CLIENT_SECRET=placeholder-build-value

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (without database connection)
RUN npx prisma generate

# Skip database migration during build - will handle at runtime
RUN echo "Skipping database migration during build - will run at application startup"

# Build the application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy source files needed for runtime
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/pages ./pages
COPY --from=builder --chown=nextjs:nodejs /app/app ./app
COPY --from=builder --chown=nextjs:nodejs /app/components ./components
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/styles ./styles
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs

# Fix permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create startup script that runs migrations then starts the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
