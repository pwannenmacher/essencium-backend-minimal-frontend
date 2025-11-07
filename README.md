# Essencium Minimal Frontend

React-basierte Admin-Oberfläche für [Essencium Backend](https://github.com/Frachtwerk/essencium-backend).

## Was macht die Anwendung?

Diese SPA bietet eine vollständige Verwaltungsoberfläche für User, Rollen, Rechte und API-Tokens. Der Funktionsumfang orientiert sich an den Essencium-Backend-APIs und deckt folgende Bereiche ab:

- **Authentication**: Login, automatische Token-Renewal (20s vor Ablauf), Logout
- **User Management**: Anlegen, Bearbeiten, Löschen von Benutzern, Passwort-Änderung
- **Rollen & Rechte**: Verwaltung von Rollen mit granularen Berechtigungen
- **API-Tokens**: Erstellen und Widerrufen von API-Tokens (eigene + Admin-Ansicht)
- **Sessions**: Übersicht über aktive Refresh-Tokens mit Markierung der aktuellen Session
- **JWT-Viewer**: Live-Anzeige des aktuellen Access-Tokens mit Payload-Dekodierung

Die UI passt sich automatisch an die Berechtigungen des angemeldeten Users an. Tabs und Aktionen werden nur angezeigt, wenn die entsprechenden Rechte vorhanden sind.

## Architektur

```text
src/
├── components/          # React-Komponenten (Dashboard, Listen, Formulare)
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

- Node.js 18+
- Laufendes Essencium-Backend auf `http://localhost:8098`

**Installation:**

```bash
npm install
```

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

## Hinweise

- Das Backend muss für CORS konfiguriert sein (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`)
- Bei Safari können Cookie-Probleme auftreten (Cross-Origin zwischen localhost-Ports) – in Production mit gleicher Domain kein Problem
- Die `API_BASE_URL` in den Services zeigt aktuell auf `http://localhost:8098` – für Production anpassen
