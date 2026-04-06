# Single-stage build
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install pnpm
RUN npm install -g pnpm

# Copy everything
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY services/payment-api ./services/payment-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the service
WORKDIR /app/services/payment-api
RUN pnpm build

# Copy assets to dist (for receipt logo etc.)
RUN cp -r src/assets dist/assets 2>/dev/null || true

# Go back to root
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=4002

EXPOSE 4002

CMD ["node", "services/payment-api/dist/main.js"]
