# Multi-stage build. The previous single-stage build used `npm ci --only=production`
# then tried to compile TypeScript, but tsc needs @types/node etc from
# devDependencies - that only worked if npm's global typescript/ts-node install
# happened to cover it, which it doesn't for type declarations. Building with
# the full dependency set in one stage, then shipping only dist/ + production
# deps in a clean runtime stage, is both reliable and produces a smaller image.

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S warframe -u 1001

# Create directories and set permissions
RUN mkdir -p /app/proxies && chown -R warframe:nodejs /app

# Switch to non-root user
USER warframe

# Expose port
EXPOSE 3529

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3529/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server.js"]
