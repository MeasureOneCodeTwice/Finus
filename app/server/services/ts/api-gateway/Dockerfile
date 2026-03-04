FROM oven/bun:1.3.10

WORKDIR /project
COPY package.json bun.lockb .
RUN --mount=type=cache,target=/root/.bun/install/cache \
bun install

WORKDIR /project/app
COPY api-gateway/package.json api-gateway/bun.lockb .
RUN --mount=type=cache,target=/root/.bun/install/cache \
bun install

WORKDIR /project
COPY tsconfig.json .
COPY common ./common

WORKDIR /project/app
COPY api-gateway/src ./src

CMD ["bun", "--no-env-file", "src/index.ts"]

