# Single-stage build
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy everything
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY services/payout-api ./services/payout-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the service
WORKDIR /app/services/payout-api
RUN pnpm build

# Go back to root
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001

CMD ["node", "services/payout-api/dist/api/main.js"]
