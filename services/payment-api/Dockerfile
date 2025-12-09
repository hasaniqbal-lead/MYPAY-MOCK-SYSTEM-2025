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

# Copy workspace structure from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/services/payment-api/package.json ./services/payment-api/

# Copy ALL node_modules from builder (includes generated Prisma client with correct version)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/services/payment-api/dist ./services/payment-api/dist

# Stay in /app directory so node_modules can be found
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=4002

EXPOSE 4002

CMD ["node", "services/payment-api/dist/main.js"]
