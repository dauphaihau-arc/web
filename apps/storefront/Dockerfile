ARG NODE_IMAGE=node:20-alpine
ARG PNPM_VERSION=8.13.1

FROM ${NODE_IMAGE} AS base

RUN apk add --no-cache libc6-compat
RUN npm install --global pnpm@${PNPM_VERSION}

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

FROM base AS build

WORKDIR /repo/apps/storefront

RUN pnpm build

FROM ${NODE_IMAGE} AS production

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

WORKDIR /app

COPY --from=build /repo/apps/storefront/.output ./.output

EXPOSE 4000

CMD ["node", ".output/server/index.mjs"]
