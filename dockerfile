# ---- Etapa 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Etapa 2: Servir con nginx ----
FROM nginx:alpine

# Plantilla de nginx (usa variable $PORT)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
