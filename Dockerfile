ARG NODE_VERSION=24.22.1

FROM node:${NODE_VERSION}-alpine AS extension-builder

WORKDIR /build/src/comunications

COPY src/comunications/package.json src/comunications/package-lock.json ./
RUN npm ci --include=dev

COPY src/comunications/ ./
RUN npm run build

FROM node:${NODE_VERSION}-alpine

WORKDIR /directus

ENV \
	DB_CLIENT="sqlite3" \
	DB_FILENAME="/directus/database/database.sqlite" \
	EXTENSIONS_PATH="/directus/extensions" \
	STORAGE_LOCAL_ROOT="/directus/uploads" \
	NODE_ENV="production" \
	NPM_CONFIG_UPDATE_NOTIFIER="false"

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
	&& mkdir -p database extensions uploads

COPY extensions/hooks/ ./extensions/hooks/
COPY --from=extension-builder /build/extensions/modules/comunications ./extensions/modules/comunications

RUN chown -R node:node /directus

USER node

EXPOSE 8055

CMD ["sh", "-c", "./node_modules/.bin/directus bootstrap && exec ./node_modules/.bin/directus start"]
