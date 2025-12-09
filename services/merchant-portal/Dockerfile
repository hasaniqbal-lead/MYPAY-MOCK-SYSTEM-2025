# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy service package
COPY services/merchant-portal/package.json ./services/merchant-portal/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy service source
COPY services/merchant-portal ./services/merchant-portal/

# Build the service
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @mypay/merchant-portal build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4010

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/services/merchant-portal/public ./public
COPY --from=builder /app/services/merchant-portal/.next/standalone ./
COPY --from=builder /app/services/merchant-portal/.next/static ./.next/static

USER nextjs

EXPOSE 4010

CMD ["node", "server.js"]
