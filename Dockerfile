# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy TypeScript configuration
COPY tsconfig*.json ./

# Install TypeScript and build dependencies
RUN npm install -g typescript ts-node

# Copy source code
COPY . .

# Build the application
RUN npm run build

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
