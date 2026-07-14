# Nuxt 4 (Nitro) frontend — SSR. `npm run build` produces a self-contained
# .output/ bundle; the runtime just runs `node .output/server/index.mjs`
# (no node_modules at runtime, no `nuxt start`, no --openssl-legacy-provider).
# Node 22 matches the deploy host.

# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# API_URL is baked as the build-time default for runtimeConfig.public.apiURL;
# it is also overridable at runtime via NUXT_PUBLIC_API_URL (see ecosystem).
ARG API_URL=https://warframe.digitalshopuy.com
ARG SITE_URL=https://warframe.digitalshopuy.com
ENV API_URL=$API_URL SITE_URL=$SITE_URL
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3312 HOST=0.0.0.0
ENV NUXT_PUBLIC_API_URL=https://warframe.digitalshopuy.com
# Nitro output is self-contained.
COPY --from=builder /app/.output ./.output

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nuxtjs -u 1001 \
  && chown -R nuxtjs:nodejs /app
USER nuxtjs

EXPOSE 3312
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3312/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", ".output/server/index.mjs"]
