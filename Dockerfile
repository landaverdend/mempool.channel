# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all packages
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend
COPY packages/server ./packages/server

# Build shared package first (dependency for both)
RUN pnpm --filter @mempool/shared build

# Build frontend and server in parallel
RUN pnpm --filter frontend build && pnpm --filter server build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built server
COPY --from=builder /app/packages/server/dist ./packages/server/dist

# Copy built frontend (static files)
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV STATIC_DIR=/app/packages/frontend/dist

EXPOSE 8080

# Start the server
CMD ["node", "packages/server/dist/index.js"]
