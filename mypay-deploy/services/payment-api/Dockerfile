# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy prisma schema
COPY prisma ./prisma/

# Copy service package
COPY services/payment-api/package.json ./services/payment-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy service source
COPY services/payment-api ./services/payment-api/

# Generate Prisma client
RUN npx prisma generate

# Build the service
RUN pnpm --filter @mypay/payment-api build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/payment-api/dist ./dist
COPY --from=builder /app/services/payment-api/package.json ./
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client in production
RUN npx prisma generate

# Set environment
ENV NODE_ENV=production
ENV PORT=4002

EXPOSE 4002

CMD ["node", "dist/main.js"]
