FROM base AS builder
RUN bun run build

FROM nginx:1.29.5-alpine3.23-perl
COPY --from=builder /app/dist /data/www
COPY nginx.conf /etc/nginx/nginx.conf
