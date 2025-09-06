# ==================================
#      Stage 1: Builder
# ==================================
FROM oven/bun:1.0 AS builder

WORKDIR /usr/src/app

# Copy dependency files first for better caching
COPY package.json bun.lockb ./

# Install dependencies with strict lockfile
RUN bun install

# Copy the rest of the application code
COPY . .

# ==================================
#      Stage 2: Production
# ==================================
FROM oven/bun:slim AS production

WORKDIR /usr/src/app

# Create non-root user and group for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup --no-create-home appuser

# Copy built app and dependencies from builder stage
COPY --from=builder /usr/src/app ./


# Create uploads and logs directories with correct ownership
RUN mkdir -p public/uploads/images utils/logs && \
    chown -R appuser:appgroup /usr/src/app public/uploads utils/logs

USER appuser

EXPOSE 5000

CMD ["bun", "index.js"]
