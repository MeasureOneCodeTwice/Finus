FROM oven/bun:1.3.9-slim AS builder

WORKDIR /app

COPY package.json .
RUN bun install

COPY tsconfig.* .
COPY vite.config.ts .
COPY index.* .
COPY public ./public
COPY src ./src

RUN bun run build

FROM nginx:1.29.5-alpine3.23-perl
COPY --from=builder /app/dist /data/www
COPY nginx.conf /etc/nginx/nginx.conf
