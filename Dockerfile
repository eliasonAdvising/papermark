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

# Build the application (this should create .next/standalone)
RUN npm run build

# Debug: Check if standalone directory was created
RUN ls -la .next/ || echo "No .next directory found"
RUN ls -la .next/standalone/ || echo "No standalone directory found"

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application - try standalone first, fallback to regular
# Copy the standalone output if it exists
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# IMPORTANT: Copy Prisma files explicitly for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy the generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install prisma CLI for migrations (since standalone doesn't include it)
RUN npm install prisma@6.16.2

# Debug: Check what files are actually in the container
RUN echo "=== Debugging file structure ===" && \
    ls -la / && \
    echo "=== /app contents ===" && \
    ls -la /app && \
    echo "=== /app/prisma contents ===" && \
    ls -la /app/prisma/ || echo "No prisma directory found" && \
    echo "=== Current working directory ===" && \
    pwd && \
    echo "=== Environment variables ===" && \
    env | grep -E "(NODE_ENV|PATH)" && \
    echo "=== Which prisma ===" && \
    which prisma || echo "Prisma not found in PATH"

# Fix permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start with database migrations then the standalone server
CMD ["sh", "-c", "echo 'Starting container...'; ls -la /app; ls -la /app/prisma || echo 'No prisma dir'; echo 'Running migration...'; npx prisma migrate deploy && echo 'Migration complete, starting server...' && node server.js"]
