# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/payment-page ./services/payment-page/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the app
ARG VITE_API_URL=https://api-darpay.vstore.cloud
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/services/payment-page
RUN pnpm build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy nginx config
COPY services/payment-page/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/services/payment-page/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
