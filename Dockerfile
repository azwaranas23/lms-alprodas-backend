# Multi-stage build for production optimization
FROM node:20-alpine3.19 AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

# Install Chromium dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    udev \
    ttf-opensans

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine3.19 AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

# Install dumb-init and Chromium dependencies for Puppeteer
RUN apk add --no-cache \
    dumb-init \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    udev \
    ttf-opensans

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy prisma schema and generate client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy only email templates needed at runtime
COPY --from=builder /app/src/common/templates ./src/common/templates

# Create uploads directories with full permissions
RUN mkdir -p uploads/avatars uploads/courses/resources uploads/subjects uploads/withdrawals uploads/topics && \
    chmod -R 777 uploads

# Expose port
EXPOSE 3000

# Health check using node since wget is not available in alpine
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application with dumb-init
CMD ["dumb-init", "node", "dist/src/main.js"]