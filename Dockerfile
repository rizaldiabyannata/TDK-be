# ==================================
#      Stage 1: Builder
# ==================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ==================================
#      Stage 2: Production
# ==================================
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Create non-root user and group for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup --no-create-home appuser

# Copy built app and dependencies from builder stage
COPY --from=builder /usr/src/app ./

# Copy application code
COPY . .

# Create uploads and logs directories with correct ownership
RUN mkdir -p public/uploads/images utils/logs && \
    chown -R appuser:appgroup /usr/src/app public/uploads utils/logs

USER appuser

EXPOSE 5000

CMD ["node", "index.js"]
