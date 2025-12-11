# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy service package
COPY services/admin-portal/package.json ./services/admin-portal/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy service source
COPY services/admin-portal ./services/admin-portal/

# Build the service
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @mypay/admin-portal build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4011

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files - standalone includes everything
COPY --from=builder /app/services/admin-portal/.next/standalone ./
COPY --from=builder /app/services/admin-portal/.next/static ./.next/static
COPY --from=builder /app/services/admin-portal/public ./public
# Copy pnpm node_modules for symlink resolution
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 4011

CMD ["node", "server.js"]
