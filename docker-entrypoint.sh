#!/bin/sh
set -e

# Erstelle eine Runtime-Konfigurationsdatei für die Umgebungsvariablen
cat > /usr/share/nginx/html/runtime-config.js << EOF
window.RUNTIME_CONFIG = {
  VITE_API_URL: '${VITE_API_URL}',
  VITE_FRONTEND_URL: '${VITE_FRONTEND_URL}'
};
EOF

echo "Runtime-Konfiguration erstellt:"
echo "  VITE_API_URL: ${VITE_API_URL}"
echo "  VITE_FRONTEND_URL: ${VITE_FRONTEND_URL}"

# Starte nginx
exec "$@"
