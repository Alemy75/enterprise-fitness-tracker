# One image, two roles (BACKLOG §9):
#   API:       node dist/main.js        (default)
#   Worker:    node dist/worker.js
#   Migration: node dist/db/migrate.js  (separate job before deploy)
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @eft/api...
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @eft/api... build \
 && pnpm install --frozen-lockfile --prod --offline --filter @eft/api...

FROM node:24-alpine
ENV NODE_ENV=production
COPY --from=build --chown=node:node /repo /repo
WORKDIR /repo/apps/api
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
