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
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_WEBHOOK_BASE_HOST
ARG NEXT_PUBLIC_APP_BASE_HOST
ARG POSTGRES_PRISMA_URL
ARG POSTGRES_PRISMA_URL_NON_POOLING
ARG UPSTASH_REDIS_REST_LOCKER_URL
ARG UPSTASH_REDIS_REST_LOCKER_TOKEN
ARG NEXTAUTH_SECRET
ARG NEXT_PUBLIC_UPLOAD_TRANSPORT
ARG NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST
ARG NEXT_PRIVATE_UPLOAD_BUCKET
ARG NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID
ARG NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY
ARG NEXT_PRIVATE_UPLOAD_REGION
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-https://papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-https://papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_WEBHOOK_BASE_HOST=${NEXT_PUBLIC_WEBHOOK_BASE_HOST:-papermark-production-bbd1.up.railway.app}
ENV NEXT_PUBLIC_APP_BASE_HOST=${NEXT_PUBLIC_APP_BASE_HOST:-papermark-production-bbd1.up.railway.app}
ENV POSTGRES_PRISMA_URL=${POSTGRES_PRISMA_URL}
ENV POSTGRES_PRISMA_URL_NON_POOLING=${POSTGRES_PRISMA_URL_NON_POOLING}
ENV UPSTASH_REDIS_REST_LOCKER_URL=${UPSTASH_REDIS_REST_LOCKER_URL}
ENV UPSTASH_REDIS_REST_LOCKER_TOKEN=${UPSTASH_REDIS_REST_LOCKER_TOKEN}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_PUBLIC_UPLOAD_TRANSPORT=${NEXT_PUBLIC_UPLOAD_TRANSPORT:-s3}
ENV NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST=${NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST}
ENV NEXT_PRIVATE_UPLOAD_BUCKET=${NEXT_PRIVATE_UPLOAD_BUCKET}
ENV NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=${NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID}
ENV NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=${NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY}
ENV NEXT_PRIVATE_UPLOAD_REGION=${NEXT_PRIVATE_UPLOAD_REGION:-us-east-1}
ENV HANKO_API_KEY=placeholder-build-value
ENV NEXT_PUBLIC_HANKO_TENANT_ID=placeholder-build-value
ENV SLACK_CLIENT_ID=placeholder-build-value
ENV SLACK_CLIENT_SECRET=placeholder-build-value
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
# Skip database migration during build - will handle at runtime
RUN echo "Skipping database migration during build - will run at application startup"
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the entire standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy necessary Prisma files for migrations
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client into standalone structure
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install Prisma CLI for migrations
RUN npm install prisma@6.16.2

# Fix permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start with migrations then server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema/schema.prisma && node server.js"]
