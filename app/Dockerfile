# Multi-stage build. `npm run build` used to chain `&& pm2 restart
# ecosystem.config.js`, which made every Docker build fail (pm2 isn't
# installed in the image and there's nothing running to restart). The build
# script itself no longer does that (see app/package.json); this also keeps
# devDependencies out of the runtime image.

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

COPY --from=builder /app/.nuxt ./.nuxt
COPY --from=builder /app/static ./static
COPY nuxt.config.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nuxtjs -u 1001

# Set permissions
RUN chown -R nuxtjs:nodejs /app

# Switch to non-root user
USER nuxtjs

# Expose port
EXPOSE 3312

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3312/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
