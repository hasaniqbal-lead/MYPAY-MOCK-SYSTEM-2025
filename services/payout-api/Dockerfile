# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY services/payout-api ./services/payout-api/

# Install ALL dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client using pnpm (ensures correct version)
RUN pnpm exec prisma generate

# Build the service
WORKDIR /app/services/payout-api
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy workspace structure from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/services/payout-api/package.json ./services/payout-api/

# Copy ALL node_modules from builder (includes generated Prisma client with correct version)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/services/payout-api/dist ./services/payout-api/dist

# Stay in /app directory so node_modules can be found
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001

CMD ["node", "services/payout-api/dist/api/main.js"]
