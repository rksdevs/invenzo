FROM node:22-bookworm AS build
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

COPY . .
RUN npm run build -w @invenzo/api
RUN npm run build -w @invenzo/web
RUN npm run prisma:generate -w @invenzo/api

FROM node:22-bookworm AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql postgresql-contrib redis-server nginx supervisor curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app
COPY infra/nginx.conf /etc/nginx/sites-available/default
COPY infra/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infra/entrypoint.sh /entrypoint.sh
COPY infra/init-db.sh /init-db.sh

RUN sed -i 's/\r$//' /entrypoint.sh /init-db.sh
RUN chmod +x /entrypoint.sh /init-db.sh
RUN mkdir -p /var/lib/postgresql/data /var/lib/redis /var/log/supervisor /run/postgresql

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=postgresql://invenzo:invenzo@127.0.0.1:5432/invenzo
ENV REDIS_URL=redis://127.0.0.1:6379
ENV JWT_ACCESS_SECRET=invenzo-access-secret
ENV JWT_REFRESH_SECRET=invenzo-refresh-secret

VOLUME ["/var/lib/postgresql/data", "/var/lib/redis"]

EXPOSE 80
EXPOSE 3001
EXPOSE 5432
EXPOSE 6379

CMD ["/entrypoint.sh"]
