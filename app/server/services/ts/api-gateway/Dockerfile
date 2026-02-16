FROM oven/bun:1.0-slim

WORKDIR /project
COPY package.json .
COPY tsconfig.json .
COPY common ./common
RUN bun install

WORKDIR /project/app
COPY api-gateway/package.json .
COPY api-gateway/src ./src
RUN bun install


CMD ["bun", "src/index.ts"]
