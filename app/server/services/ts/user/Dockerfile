FROM oven/bun:1.0-slim

WORKDIR /project
COPY package.json bun.lockb .
RUN --mount=type=cache,target=/root/.bun/install/cache \
bun install

WORKDIR /project/app
COPY user/package.json user/bun.lockb .
RUN --mount=type=cache,target=/root/.bun/install/cache \
bun install

WORKDIR /project
COPY tsconfig.json .
COPY common ./common

WORKDIR /project/app
COPY user/src ./src

CMD ["bun", "--no-env-file", "src/index.ts"]
