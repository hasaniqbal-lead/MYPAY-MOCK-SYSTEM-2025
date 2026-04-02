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

# Branding build args — baked into the Next.js build
ARG NEXT_PUBLIC_ORG_BRAND_NAME
ARG NEXT_PUBLIC_ORG_PRIMARY_COLOR
ARG NEXT_PUBLIC_ORG_LOGO_URL
ARG NEXT_PUBLIC_ORG_LOGO_DARK_URL
ARG NEXT_PUBLIC_ORG_SUPPORT_EMAIL
ARG NEXT_PUBLIC_ORG_SLUG
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_API_URL

# Expose ARGs as ENVs so Next.js can inline them at build time
ENV NEXT_PUBLIC_ORG_BRAND_NAME=$NEXT_PUBLIC_ORG_BRAND_NAME
ENV NEXT_PUBLIC_ORG_PRIMARY_COLOR=$NEXT_PUBLIC_ORG_PRIMARY_COLOR
ENV NEXT_PUBLIC_ORG_LOGO_URL=$NEXT_PUBLIC_ORG_LOGO_URL
ENV NEXT_PUBLIC_ORG_LOGO_DARK_URL=$NEXT_PUBLIC_ORG_LOGO_DARK_URL
ENV NEXT_PUBLIC_ORG_SUPPORT_EMAIL=$NEXT_PUBLIC_ORG_SUPPORT_EMAIL
ENV NEXT_PUBLIC_ORG_SLUG=$NEXT_PUBLIC_ORG_SLUG
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ADMIN_API_URL=$NEXT_PUBLIC_ADMIN_API_URL

RUN pnpm --filter @darpay/admin-portal build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4011

# Install pnpm
RUN npm install -g pnpm

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/services/admin-portal/package.json ./services/admin-portal/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/services/admin-portal/.next ./services/admin-portal/.next
COPY --from=builder --chown=nextjs:nodejs /app/services/admin-portal/public ./services/admin-portal/public
COPY --from=builder --chown=nextjs:nodejs /app/services/admin-portal/next.config.js ./services/admin-portal/
COPY --from=builder --chown=nextjs:nodejs /app/services/admin-portal/package.json ./services/admin-portal/package.json

WORKDIR /app/services/admin-portal

USER nextjs

EXPOSE 4011

CMD ["pnpm", "start"]
