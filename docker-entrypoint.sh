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

# CSP: connect-src auf den API-Origin (Schema + Host + Port) einschränken
API_ORIGIN=$(printf '%s' "${VITE_API_URL}" | sed -E 's#^(https?://[^/]+).*#\1#')
export API_ORIGIN
envsubst '${API_ORIGIN}' \
    < /etc/nginx/templates/security-headers.conf.template \
    > /etc/nginx/generated/security-headers.conf
echo "  CSP connect-src: 'self' ${API_ORIGIN}"

# Starte nginx
exec "$@"
