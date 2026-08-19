import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import { RIGHTS } from '../constants';

// Die Panel-Inhalte haben eigene Tests; hier geht es um Tabs und Rechte-Gating.
// Factories inline: vi.mock wird gehoistet, ein Helper wäre noch undefined.
vi.mock('./UserProfile', () => ({ default: () => <div>Stub-UserProfile</div> }));
vi.mock('./UserRolesRights', () => ({ default: () => <div>Stub-UserRolesRights</div> }));
vi.mock('./UserTokens', () => ({ default: () => <div>Stub-UserTokens</div> }));
vi.mock('./JwtViewer', () => ({ default: () => <div>Stub-JwtViewer</div> }));
vi.mock('./UserList', () => ({ default: () => <div>Stub-UserList</div> }));
vi.mock('./RoleList', () => ({ default: () => <div>Stub-RoleList</div> }));
vi.mock('./ApiTokenList', () => ({ default: () => <div>Stub-ApiTokenList</div> }));
vi.mock('./ApiTokenAdminList', () => ({ default: () => <div>Stub-ApiTokenAdminList</div> }));
vi.mock('./SessionTokenAdminList', () => ({
  default: () => <div>Stub-SessionTokenAdminList</div>,
}));
vi.mock('./ApiDocsViewer', () => ({ default: () => <div>Stub-ApiDocsViewer</div> }));
vi.mock('./ThemeToggle', () => ({ default: () => <div>Stub-ThemeToggle</div> }));

const render = (overrides = {}) => {
  const authContext = { ...createAuthContext(overrides), ...(overrides.context ?? {}) };
  renderWithProviders(<Dashboard />, { authContext });
  return authContext;
};

const tabNames = () =>
  screen
    .getAllByRole('tab')
    .map((t) => t.textContent)
    .sort();

describe('Dashboard', () => {
  it('zeigt ohne besondere Rechte nur Profil, Benutzer und API-Doku', () => {
    render();

    expect(tabNames()).toEqual(['API-Dokumentation', 'Alle Benutzer', 'Mein Profil']);
  });

  it('zeigt einen Ladezustand, solange die User-Daten fehlen', () => {
    const ctx = createAuthContext();
    renderWithProviders(<Dashboard />, {
      authContext: { ...ctx, user: null, token: 'jwt-token' },
    });

    expect(screen.getByText('Lade Benutzerdaten...')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('schaltet den Rollen-Tab mit ROLE_READ frei', () => {
    render({ rights: [RIGHTS.ROLE_READ] });

    expect(tabNames()).toContain('Rollen-Verwaltung');
  });

  it('schaltet den API-Token-Tab mit API_TOKEN frei', () => {
    render({ rights: [RIGHTS.API_TOKEN] });

    expect(tabNames()).toContain('API-Tokens');
    expect(tabNames()).not.toContain('API-Token Admin');
  });

  it('schaltet mit API_TOKEN_ADMIN sowohl den eigenen als auch den Admin-Tab frei', () => {
    render({ rights: [RIGHTS.API_TOKEN_ADMIN] });

    expect(tabNames()).toContain('API-Tokens');
    expect(tabNames()).toContain('API-Token Admin');
  });

  it('schaltet den Session-Token-Admin-Tab mit SESSION_TOKEN_ADMIN frei', () => {
    render({ rights: [RIGHTS.SESSION_TOKEN_ADMIN] });

    expect(tabNames()).toContain('Session-Token Admin');
  });

  it('zeigt mit allen Rechten alle sieben Tabs', () => {
    render({ rights: Object.values(RIGHTS) });

    expect(screen.getAllByRole('tab')).toHaveLength(7);
  });

  it('startet auf dem Profil-Tab', () => {
    render();

    expect(screen.getByText('Stub-UserProfile')).toBeInTheDocument();
    expect(screen.getByText('Stub-JwtViewer')).toBeInTheDocument();
  });

  it('wechselt auf den Benutzer-Tab', async () => {
    render();

    fireEvent.click(screen.getByRole('tab', { name: 'Alle Benutzer' }));

    expect(await screen.findByText('Stub-UserList')).toBeInTheDocument();
  });

  // Der rapidoc-Chunk soll nicht schon beim Login geladen werden.
  it('lädt die API-Doku erst beim Öffnen ihres Tabs', async () => {
    render();

    expect(screen.queryByText('Stub-ApiDocsViewer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'API-Dokumentation' }));

    expect(await screen.findByText('Stub-ApiDocsViewer')).toBeInTheDocument();
  });

  it('meldet den Benutzer über den Abmelden-Button ab', async () => {
    const ctx = render();

    fireEvent.click(screen.getByRole('button', { name: /Abmelden/i }));

    await waitFor(() => expect(ctx.logout).toHaveBeenCalledTimes(1));
  });
});
