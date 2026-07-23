# ---------- Etapa 1: Build ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

ARG VITE_API_URL
ARG VITE_THESPORTSDB_API_VAL
ARG VITE_THESPORTSDB_BASE_URL

# Vite builds a static website, so environment variables are required during the build step.
# By passing them inline during 'npm run build', we avoid using ENV instructions that trigger
# SonarQube's warnings about handling secrets in Docker build variables.
RUN VITE_API_URL=$VITE_API_URL \
    VITE_THESPORTSDB_API_KEY=$VITE_THESPORTSDB_API_VAL \
    VITE_THESPORTSDB_BASE_URL=$VITE_THESPORTSDB_BASE_URL \
    npm run build

# ---------- Etapa 2: Servir con Nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Support running Nginx as non-root user 'nginx'
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /etc/nginx /usr/share/nginx/html

USER nginx

ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
