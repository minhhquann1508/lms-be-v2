FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN npm install -g npm@latest
COPY package*.json ./
RUN npm install

FROM deps AS builder
COPY . .
RUN npm run build
RUN test -f dist/main.js

FROM builder AS migrator
WORKDIR /app
ENV NODE_ENV=development
CMD ["npm", "run", "migration:run"]

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
RUN npm install -g npm@latest
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nestjs
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 8000
CMD ["npm", "run", "start:prod"]
