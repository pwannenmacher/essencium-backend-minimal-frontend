# Multi-stage build für Essencium Frontend

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm ci

# Source kopieren und bauen
COPY . .
RUN npm run build

# Stage 2: Runtime mit nginx
FROM nginx:alpine

# Kopiere Custom nginx Konfiguration
COPY nginx.conf /etc/nginx/nginx.conf

# Kopiere gebaute App
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiere Runtime-Konfigurationsskript
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Umgebungsvariablen mit Defaults
ENV VITE_API_URL=http://localhost:8098
ENV VITE_FRONTEND_URL=http://localhost:5173

EXPOSE 80

# Verwende Custom Entrypoint für Runtime-Konfiguration
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
