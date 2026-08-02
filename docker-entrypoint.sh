#!/bin/sh
set -e

# Env-URLs strikt validieren (fail fast): Die Werte landen unescaped in
# runtime-config.js (ausgeliefertes JS) und in der generierten nginx-CSP —
# unerwartete Zeichen (Quotes, Semikolons, Whitespace, Query-Strings) könnten
# dort JS bzw. nginx-Direktiven injizieren.
URL_PATTERN='^https?://([A-Za-z0-9._-]+|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?$'
for VAR_NAME in VITE_API_URL VITE_FRONTEND_URL; do
    eval "VAR_VALUE=\${${VAR_NAME}}"
    if ! printf '%s' "${VAR_VALUE}" | grep -Eq "${URL_PATTERN}"; then
        echo "FEHLER: ${VAR_NAME} ist keine gültige http(s)-URL: '${VAR_VALUE}'" >&2
        exit 1
    fi
done

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

# CSP: connect-src auf den API-Origin (Schema + Host + Port) einschränken.
# Ableitung per POSIX-Parameter-Expansion (kein sed nötig, BusyBox-sicher):
# Schema + alles vor dem ersten '/' nach dem '//'.
API_SCHEME="${VITE_API_URL%%://*}"
API_HOSTPORT="${VITE_API_URL#*://}"
API_ORIGIN="${API_SCHEME}://${API_HOSTPORT%%/*}"
if ! printf '%s' "${API_ORIGIN}" | grep -Eq '^https?://([A-Za-z0-9._-]+|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?$'; then
    echo "FEHLER: API-Origin konnte nicht aus VITE_API_URL abgeleitet werden: '${API_ORIGIN}'" >&2
    exit 1
fi
export API_ORIGIN
envsubst '${API_ORIGIN}' \
    < /etc/nginx/templates/security-headers.conf.template \
    > /etc/nginx/generated/security-headers.conf
echo "  CSP connect-src: 'self' ${API_ORIGIN}"

# Starte nginx
exec "$@"
