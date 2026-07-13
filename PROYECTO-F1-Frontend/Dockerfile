# ---------- Etapa 1: Build ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_THESPORTSDB_API_KEY
ARG VITE_THESPORTSDB_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_THESPORTSDB_API_KEY=$VITE_THESPORTSDB_API_KEY
ENV VITE_THESPORTSDB_BASE_URL=$VITE_THESPORTSDB_BASE_URL

RUN npm run build

# ---------- Etapa 2: Servir con Nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
