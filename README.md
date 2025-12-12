# Essencium Minimal Frontend

React-basierte Admin-Oberfläche für [Essencium Backend](https://github.com/Frachtwerk/essencium-backend).

## Was macht die Anwendung?

Diese SPA bietet eine vollständige Verwaltungsoberfläche für User, Rollen, Rechte und API-Tokens. Der Funktionsumfang orientiert sich an den Essencium-Backend-APIs und deckt folgende Bereiche ab:

- **Authentication**: Login, automatische Token-Renewal (20s vor Ablauf), Logout
- **OAuth2**: Unterstützung für OAuth2-Login (Google, GitHub) mit Redirect-Handling
- **User Management**: Anlegen, Bearbeiten, Löschen von Benutzern, Passwort-Änderung
- **Rollen & Rechte**: Verwaltung von Rollen mit granularen Berechtigungen
- **API-Tokens**: Erstellen und Widerrufen von API-Tokens (eigene + Admin-Ansicht)
- **Sessions**: Übersicht über aktive Refresh-Tokens mit Markierung der aktuellen Session
- **Session-Token Admin**: Admin-Ansicht aller Session-Tokens aller Benutzer mit Löschfunktion (erfordert `SESSION_TOKEN_ADMIN` Recht)
- **JWT-Viewer**: Live-Anzeige des aktuellen Access-Tokens mit Payload-Dekodierung
- **Swagger-UI**: Anzeige der API-Dokumentation des Backends

Die UI passt sich automatisch an die Berechtigungen des angemeldeten Users an. Tabs und Aktionen werden nur angezeigt, wenn die entsprechenden Rechte vorhanden sind.

## Architektur

```text
src/
├── components/         # React-Komponenten (Dashboard, Listen, Formulare)
├── context/            # React Context (Auth, Theme)
├── services/           # API-Layer (authService, userService, roleService, apiTokenService)
├── App.jsx             # Root-Komponente mit Providern
└── main.jsx            # Entry Point
```

**Technologie-Stack:**

- React 19 + Vite
- Mantine v7 (UI Components, Forms, Notifications)
- Context API für Auth & Theme-Management
- JWT-basierte Authentication mit HTTP-only Cookies

**Besonderheiten:**

- Tab-basiertes Lazy-Loading (Daten werden erst beim Aufruf des Tabs geladen)
- Automatische Token-Renewal durch JWT `exp`-Claim-Parsing
- Dark Mode mit Auto-Erkennung (System-Theme)
- Parent-Token-ID Tracking für Session-Highlighting

## Setup

**Voraussetzungen:**

- Node.js 24+
- Laufendes Essencium-Backend auf `http://localhost:8098`

**Installation:**

```bash
npm install
```

**Umgebungsvariablen (optional):**

Die Anwendung nutzt folgende Umgebungsvariablen, die über eine `.env`-Datei gesetzt werden können:

```bash
# Backend API URL (Standard: http://localhost:8098)
VITE_API_URL=http://localhost:8098

# Frontend URL für OAuth-Redirects (Standard: window.location.origin)
VITE_FRONTEND_URL=http://localhost:5173
```

Eine `.env.example`-Datei mit allen verfügbaren Variablen ist im Repository enthalten. Für die Entwicklung können die Defaults verwendet werden.

**Development Server starten:**

```bash
npm run dev
```

Die Anwendung läuft unter `http://localhost:5173`.

**Test-Credentials (Backend Default):**

- Admin: `devnull@frachtwerk.de` / `adminAdminAdmin`
- User: `devnull_user@frachtwerk.de` / `userUserUser`

## Build

```bash
npm run build
```

Build-Output landet in `dist/`.

**Production-Build mit benutzerdefinierten URLs:**

Für Docker oder Production-Deployments können die Umgebungsvariablen beim Build gesetzt werden:

```bash
VITE_API_URL=https://api.example.com VITE_FRONTEND_URL=https://app.example.com npm run build
```

## Docker

**Image bauen:**

```bash
docker build -t essencium-frontend .
```

**Container starten:**

```bash
docker run -p 8080:80 \
  -e VITE_API_URL=http://localhost:8098 \
  -e VITE_FRONTEND_URL=http://localhost:8080 \
  essencium-frontend
```

**Mit Docker Compose:**

```bash
docker-compose up -d
```

Die Umgebungsvariablen können in der `docker-compose.yml` angepasst werden. Die Konfiguration erfolgt zur **Laufzeit**, nicht zur Build-Zeit - das Image kann also mit unterschiedlichen URLs wiederverwendet werden.

## Tests

Das Projekt verwendet **Vitest** mit React Testing Library für Unit-, Integration- und Component-Tests.

**Tests ausführen:**

```bash
# Watch-Modus (für Development)
npm test

# Einmalig ausführen
npm run test:run

# Mit Coverage-Report
npm run test:coverage

# Mit UI (Browser-basiert)
npm run test:ui
```

**Test-Coverage:**

Der Coverage-Report wird in `coverage/` generiert. Öffne `coverage/index.html` im Browser für einen detaillierten Bericht.

**Was wird getestet:**

- **Config-Tests**: Runtime-Konfiguration und Umgebungsvariablen-Fallbacks
- **Service-Tests**: API-Calls, Fehlerbehandlung, Request-Formate (authService, userService, roleService)
- **AuthContext-Tests**: Token-Renewal, Permissions, OAuth-Flow, Login/Logout
- **Component-Tests**: Permission-basiertes Rendering (Dashboard, UserList, Login)

**Neue Tests hinzufügen:**

Erstelle `*.test.js` oder `*.test.jsx` Dateien neben den zu testenden Komponenten/Services. Vitest findet diese automatisch.

## Hinweise

- Das Backend muss für CORS konfiguriert sein (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`)
- Bei Safari können Cookie-Probleme auftreten (Cross-Origin zwischen localhost-Ports) – in Production mit gleicher Domain kein Problem
- Backend- und Frontend-URLs können über Umgebungsvariablen konfiguriert werden (siehe Setup-Abschnitt)
- Im Docker-Deployment werden die Umgebungsvariablen zur Laufzeit injiziert, sodass ein Image für verschiedene Umgebungen genutzt werden kann
