# The backend of yasiu.pl: the API routes in server/ (see README.md in this folder).
# Nitro builds a Node.js server with all its dependencies in .output/. The image contains only
# that folder. Build context: the root of the repository (see docker-compose.yml).
FROM docker.io/library/node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
# --ignore-scripts: the backend does not need the build of the site (webpack, the CV).
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY nitro.config.mjs ./
COPY server ./server
RUN NITRO_PRESET=node-server npx nitro build

FROM docker.io/library/node:22-alpine
WORKDIR /app
COPY --from=build /src/.output ./
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
# uid 1000 = node in the image = yasiu on blade12. The sops secrets belong to uid 1000.
USER node
EXPOSE 3000
CMD ["node", "server/index.mjs"]
