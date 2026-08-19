import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import UserTokens from './UserTokens';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as userService from '../services/userService';

vi.mock('../services/userService');

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

const segment = (obj) => toBase64Url(new TextEncoder().encode(JSON.stringify(obj)));

/** Token, dessen parent_token_id die aktuelle Refresh-Session markiert. */
const tokenWithParent = (parentTokenId) =>
  `${segment({ alg: 'HS256', typ: 'JWT' })}.${segment({
    sub: 'admin@example.com',
    parent_token_id: parentTokenId,
  })}.sig`;

const sessions = [
  {
    id: 'refresh-1',
    type: 'REFRESH',
    userAgent: 'Firefox auf Linux',
    issuedAt: '2026-01-15T10:00:00Z',
    expiration: '2026-02-15T10:00:00Z',
    lastUsed: '2026-01-16T08:00:00Z',
  },
  { id: 'access-1', type: 'ACCESS', issuedAt: '2026-01-16T09:00:00Z' },
];

const render = (token) =>
  renderWithProviders(<UserTokens />, { authContext: createAuthContext({ token }) });

describe('UserTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.getMyTokens.mockResolvedValue(sessions);
  });

  afterEach(() => {
    notifications.clean();
  });

  it('zeigt einen Ladezustand vor der Antwort', () => {
    userService.getMyTokens.mockReturnValue(new Promise(() => {}));

    render(tokenWithParent('refresh-1'));

    expect(screen.getByText('Lade Token-Informationen...')).toBeInTheDocument();
  });

  it('listet die aktiven Sessions mit Anzahl und Details', async () => {
    render(tokenWithParent('refresh-1'));

    expect(await screen.findByText('Aktive Sessions')).toBeInTheDocument();
    expect(screen.getByText('REFRESH')).toBeInTheDocument();
    expect(screen.getByText('ACCESS')).toBeInTheDocument();
    expect(screen.getByText(/Firefox auf Linux/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // Eigene Session = Refresh-Token mit id == parent_token_id des Access-Tokens.
  it('markiert die eigene Session anhand der parent_token_id', async () => {
    render(tokenWithParent('refresh-1'));

    expect(await screen.findByText('Aktuelle Session')).toBeInTheDocument();
  });

  it('markiert keine Session, wenn die parent_token_id nicht passt', async () => {
    render(tokenWithParent('ein-anderer-token'));

    await screen.findByText('REFRESH');
    expect(screen.queryByText('Aktuelle Session')).not.toBeInTheDocument();
  });

  it('meldet eine leere Session-Liste', async () => {
    userService.getMyTokens.mockResolvedValue([]);

    render(tokenWithParent('refresh-1'));

    expect(await screen.findByText('Keine aktiven Sessions gefunden')).toBeInTheDocument();
  });

  it('behandelt eine unerwartete Antwortform defensiv', async () => {
    userService.getMyTokens.mockResolvedValue({ nope: true });

    render(tokenWithParent('refresh-1'));

    expect(await screen.findByText('Keine aktiven Sessions gefunden')).toBeInTheDocument();
  });

  it('zeigt die Fehlermeldung, wenn das Laden fehlschlägt', async () => {
    userService.getMyTokens.mockRejectedValue(new Error('Sitzung abgelaufen'));

    render(tokenWithParent('refresh-1'));

    expect(await screen.findByText('Sitzung abgelaufen')).toBeInTheDocument();
  });

  it('beendet eine Session nach Bestätigung und lädt neu', async () => {
    userService.deleteMyToken.mockResolvedValue(undefined);

    render(tokenWithParent('refresh-1'));
    await screen.findByText('REFRESH');

    fireEvent.click(screen.getAllByRole('button', { name: '' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Session beenden' }));

    await waitFor(() =>
      expect(userService.deleteMyToken).toHaveBeenCalledWith(expect.any(String), 'refresh-1')
    );
    expect(await screen.findByText('Session wurde beendet')).toBeInTheDocument();
    await waitFor(() => expect(userService.getMyTokens).toHaveBeenCalledTimes(2));
  });

  it('zeigt die Backend-Meldung, wenn das Beenden fehlschlägt', async () => {
    userService.deleteMyToken.mockRejectedValue(new Error('Nicht gefunden'));

    render(tokenWithParent('refresh-1'));
    await screen.findByText('REFRESH');

    fireEvent.click(screen.getAllByRole('button', { name: '' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Session beenden' }));

    expect(await screen.findByText('Nicht gefunden')).toBeInTheDocument();
  });
});
