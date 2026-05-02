# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable
COPY package.json ./
RUN npm install

COPY tsconfig.json drizzle.config.ts vite.config.ts tailwind.config.js postcss.config.js ./
COPY drizzle ./drizzle
COPY server ./server
COPY client ./client

RUN npm run build

# ── Runtime ──────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/dist/public   ./dist/public
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json
COPY seed.mjs ./seed.mjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
