# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY src/ ./src/
RUN npm run build

# Stage 2: Production Runner (Non-root user)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Set directory permissions and switch to unprivileged built-in node user
RUN chown -R node:node /app
USER node

EXPOSE 5000

# Healthcheck probing live endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health/live || exit 1

# Start the application in exec form
CMD ["node", "dist/server.js"]
