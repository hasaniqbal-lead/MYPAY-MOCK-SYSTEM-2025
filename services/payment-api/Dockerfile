# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY services/payment-api ./services/payment-api/

# Install ALL dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client using pnpm (ensures correct version)
RUN pnpm exec prisma generate

# Build the service
WORKDIR /app/services/payment-api
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY services/payment-api/package.json ./services/payment-api/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy generated Prisma client from builder (rock-solid approach)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/services/payment-api/dist ./services/payment-api/dist

# Set working directory to service
WORKDIR /app/services/payment-api

# Set environment
ENV NODE_ENV=production
ENV PORT=4002

EXPOSE 4002

CMD ["node", "dist/main.js"]
