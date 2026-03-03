FROM oven/bun:1.0-slim

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

EXPOSE 3002

CMD ["bun", "src/index.ts"]