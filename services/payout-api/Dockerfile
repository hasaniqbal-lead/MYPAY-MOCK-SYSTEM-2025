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

# Generate Prisma client
RUN npx prisma generate

# Build the service
WORKDIR /app/services/payout-api
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY services/payout-api/package.json ./services/payout-api/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/services/payout-api/dist ./services/payout-api/dist

# Set working directory to service
WORKDIR /app/services/payout-api

# Set environment
ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001

CMD ["node", "dist/api/main.js"]
