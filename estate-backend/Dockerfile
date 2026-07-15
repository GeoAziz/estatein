# Multi-stage build for EstateIn backend

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate the Prisma client (schema-derived types the TypeScript build and
# runtime both depend on — `npm ci` alone does not produce these).
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# `npm ci --omit=dev` installs the plain @prisma/client package, but not the
# generated client code (that only exists after `prisma generate`, run above
# in the builder stage) — copy the generated output over rather than
# regenerating, since regenerating here would need the dev-only prisma CLI.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Create health check script
COPY --from=builder /app/.docker/health-check.js ./health-check.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node ./health-check.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
