ARG BUILD_IMAGE=node:20-alpine
ARG PNPM_VERSION=9.3.0

FROM $BUILD_IMAGE AS base

# update and install the latest dependencies for the alpine version
RUN apk update && apk upgrade

RUN npm --global install pnpm@${PNPM_VERSION}

WORKDIR /app

COPY .npmrc package*.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE 4000

CMD ["pnpm", "dev"]


FROM base AS build

WORKDIR /app

COPY . .

# build the nuxt project to generate the artifacts in .output directory
RUN pnpm build


FROM $BUILD_IMAGE AS production-deps

ARG PNPM_VERSION=9.3.0

WORKDIR /app

COPY .npmrc package*.json pnpm-lock.yaml ./

RUN npm --global install pnpm@${PNPM_VERSION}

RUN pnpm install --prod --ignore-scripts


FROM $BUILD_IMAGE as production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY package.json ./

EXPOSE 4000

ENV HOST=0.0.0.0 PORT=4000

CMD ["node", ".output/server/index.mjs"]
