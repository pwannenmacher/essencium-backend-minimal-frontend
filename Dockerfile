# Multi-stage build für Essencium Frontend

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Dependencies installieren (ohne Lifecycle-Skripte -> geringere Supply-Chain-Angriffsfläche)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Source kopieren und bauen
COPY . .
RUN npm run build

# Stage 2: Runtime mit nicht-privilegiertem nginx (läuft als non-root, Port 8080)
FROM nginxinc/nginx-unprivileged:alpine

# Für Kopier-/chown-Schritte kurzzeitig root, danach zurück auf den nginx-User
USER root

# Kopiere Custom nginx Konfiguration und Security-Header-Template
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-security-headers.conf.template /etc/nginx/templates/security-headers.conf.template

# Security-Header mit Build-Defaults vorrendern (Fallback, falls der Entrypoint
# umgangen wird); das Verzeichnis gehört dem nginx-User, damit der Entrypoint
# zur Laufzeit den echten API-Origin einsetzen kann.
RUN mkdir -p /etc/nginx/generated \
    && API_ORIGIN="http://localhost:8098" envsubst '${API_ORIGIN}' \
        < /etc/nginx/templates/security-headers.conf.template \
        > /etc/nginx/generated/security-headers.conf \
    && chown -R nginx:nginx /etc/nginx/generated

# Kopiere gebaute App
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiere Runtime-Konfigurationsskript
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh \
    && chown -R nginx:nginx /usr/share/nginx/html

# Zurück auf den nicht-privilegierten Benutzer
USER nginx

# Umgebungsvariablen mit Defaults
ENV VITE_API_URL=http://localhost:8098
ENV VITE_FRONTEND_URL=http://localhost:5173

EXPOSE 8080

# Verwende Custom Entrypoint für Runtime-Konfiguration
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
