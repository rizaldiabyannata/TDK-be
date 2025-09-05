FROM oven/bun:latest

WORKDIR /usr/src/app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

RUN addgroup --system appgroup && adduser --system --ingroup appgroup --no-create-home appuser \
    && mkdir -p uploads logs \
    && chown -R appuser:appgroup /usr/src/app uploads logs

USER appuser

EXPOSE 5000

CMD ["bun", "index.js"]
