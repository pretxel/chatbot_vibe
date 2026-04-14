FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm

ARG NEXT_PUBLIC_BACKEND_URL
RUN test -n "$NEXT_PUBLIC_BACKEND_URL" || \
    { echo "ERROR: NEXT_PUBLIC_BACKEND_URL build arg is required"; exit 1; }
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
