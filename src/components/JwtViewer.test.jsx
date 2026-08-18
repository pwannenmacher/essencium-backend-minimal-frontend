import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import JwtViewer from './JwtViewer';
import { renderWithProviders } from '../test/helpers';

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

const segment = (obj) => toBase64Url(new TextEncoder().encode(JSON.stringify(obj)));

const makeToken = (payload, header = { alg: 'HS256', typ: 'JWT' }) =>
  `${segment(header)}.${segment(payload)}.sig-abc`;

const now = () => Math.floor(Date.now() / 1000);

function renderViewer({ token, forceRenewToken = vi.fn() } = {}) {
  renderWithProviders(<JwtViewer />, {
    authContext: {
      token,
      isAuthenticated: !!token,
      user: null,
      hasPermission: () => false,
      forceRenewToken,
    },
  });
  return { forceRenewToken };
}

describe('JwtViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    notifications.clean();
  });

  it('zeigt einen Hinweis, wenn kein Token vorhanden ist', () => {
    renderViewer({ token: null });

    expect(screen.getByText('Kein Token verfügbar')).toBeInTheDocument();
  });

  it('meldet einen nicht dekodierbaren Token', () => {
    renderViewer({ token: 'kein.gueltiger.token-!!!' });

    expect(screen.getByText('Token konnte nicht dekodiert werden')).toBeInTheDocument();
  });

  // Regression zu ST7: mit atob() ohne Base64URL-Ersetzung landete dieser Token
  // fälschlich im "konnte nicht dekodiert werden"-Zweig.
  it('dekodiert einen Token, dessen Segmente Base64URL-Zeichen enthalten', () => {
    const token = makeToken({ sub: 'ü?ÿ>>>@example.com', exp: now() + 3600 });

    renderViewer({ token });

    expect(screen.queryByText('Token konnte nicht dekodiert werden')).not.toBeInTheDocument();
    expect(screen.getByText('ü?ÿ>>>@example.com')).toBeInTheDocument();
  });

  it('zeigt Header, Subject, Signatur und Gültig-Badge eines gültigen Tokens', () => {
    const token = makeToken({ sub: 'admin@example.com', iat: now(), exp: now() + 3600 });

    renderViewer({ token });

    expect(screen.getByText('Gültig')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('sig-abc')).toBeInTheDocument();
    expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
  });

  it('markiert einen abgelaufenen Token und sperrt das Erneuern', () => {
    const token = makeToken({ sub: 'admin@example.com', exp: now() - 60 });

    renderViewer({ token });

    expect(screen.getByText('Abgelaufen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Erneuern/i })).toBeDisabled();
  });

  it('zeigt die Authorities aus dem Payload als Badges', () => {
    const token = makeToken({
      sub: 'admin@example.com',
      exp: now() + 3600,
      authorities: [{ authority: 'ROLE_READ' }, 'API_TOKEN'],
    });

    renderViewer({ token });

    expect(screen.getByText('ROLE_READ')).toBeInTheDocument();
    expect(screen.getByText('API_TOKEN')).toBeInTheDocument();
  });

  it('erneuert den Token und zeigt eine Erfolgs-Notification', async () => {
    const forceRenewToken = vi.fn().mockResolvedValue({ success: true });
    const token = makeToken({ sub: 'admin@example.com', exp: now() + 3600 });

    renderViewer({ token, forceRenewToken });
    fireEvent.click(screen.getByRole('button', { name: /Erneuern/i }));

    await waitFor(() => expect(forceRenewToken).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Token wurde erfolgreich erneuert')).toBeInTheDocument();
  });

  it('zeigt die Fehlermeldung, wenn das Erneuern fehlschlägt', async () => {
    const forceRenewToken = vi.fn().mockRejectedValue(new Error('Kein Token verfügbar'));
    const token = makeToken({ sub: 'admin@example.com', exp: now() + 3600 });

    renderViewer({ token, forceRenewToken });
    fireEvent.click(screen.getByRole('button', { name: /Erneuern/i }));

    await waitFor(() => expect(forceRenewToken).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Kein Token verfügbar')).toBeInTheDocument();
  });
});
