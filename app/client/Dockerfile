FROM finus-webserver-base:local as base
RUN bun run build

FROM nginx:1.29.5-alpine3.23-perl
COPY --from=base /app/dist /data/www 
COPY nginx.conf /etc/nginx/nginx.conf
