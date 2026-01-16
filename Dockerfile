# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Create minimal .env for build (actual values come from runtime environment)
RUN echo "DATABASE_URL=postgresql://user:pass@localhost:5432/db" > .env && \
    echo "JWT_SECRET=build-time-placeholder" >> .env && \
    echo "JWT_REFRESH_SECRET=build-time-placeholder" >> .env

RUN npx prisma generate
# Use 2.5GB heap limit - safe for VPS with 4GB RAM
RUN NODE_OPTIONS="--max-old-space-size=2560" npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Copy built app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "build"]
