import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import SessionTokenAdminList from './SessionTokenAdminList';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as userService from '../services/userService';

vi.mock('../services/userService');

const HOUR = 60 * 60 * 1000;
const future = new Date(Date.now() + HOUR).toISOString();
const past = new Date(Date.now() - HOUR).toISOString();

// Antwortform des Admin-Endpunkts: Map userId -> Token-Liste
const sessionTokensByUser = {
  'user-1': [
    {
      id: 'token-1',
      type: 'REFRESH',
      username: 'admin@example.com',
      userAgent: 'Firefox',
      issuedAt: past,
      expiration: future,
      lastUsed: past,
    },
  ],
  'user-2': [
    {
      id: 'token-2',
      type: 'ACCESS',
      username: 'user@example.com',
      userAgent: 'Chrome',
      issuedAt: past,
      expiration: past,
      lastUsed: null,
    },
  ],
};

async function openRowMenu(rowIndex = 0) {
  const menuButtons = await screen.findAllByRole('button', { name: '' });
  fireEvent.click(menuButtons[rowIndex]);
}

async function confirmDeletion() {
  fireEvent.click(await screen.findByRole('button', { name: 'Löschen' }));
}

describe('SessionTokenAdminList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.getAllUsersWithTokens.mockResolvedValue(sessionTokensByUser);
  });

  afterEach(() => {
    notifications.clean();
  });

  it('lädt die Session-Tokens aller Benutzer und zeigt sie', async () => {
    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('Firefox')).toBeInTheDocument();
    expect(userService.getAllUsersWithTokens).toHaveBeenCalledWith('jwt-token');
  });

  it('lädt nichts, solange der Tab nicht aktiv ist', () => {
    renderWithProviders(<SessionTokenAdminList active={false} />, {
      authContext: createAuthContext(),
    });

    expect(userService.getAllUsersWithTokens).not.toHaveBeenCalled();
  });

  it('zeigt den Empty-State, wenn kein Benutzer Tokens hat', async () => {
    userService.getAllUsersWithTokens.mockResolvedValue({});

    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Keine Session-Tokens gefunden')).toBeInTheDocument();
  });

  it('überspringt Benutzer mit leerer Token-Liste', async () => {
    userService.getAllUsersWithTokens.mockResolvedValue({ 'user-3': [] });

    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Keine Session-Tokens gefunden')).toBeInTheDocument();
  });

  it('zeigt eine Fehler-Notification, wenn das Laden fehlschlägt', async () => {
    userService.getAllUsersWithTokens.mockRejectedValue(new Error('Keine Berechtigung'));

    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });

    expect(
      await screen.findByText('Session-Tokens konnten nicht geladen werden')
    ).toBeInTheDocument();
  });

  it('markiert abgelaufene und aktive Tokens unterschiedlich', async () => {
    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByText('Abgelaufen')).toBeInTheDocument();
  });

  it('filtert die Tabelle über die Benutzer-Suche', async () => {
    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    fireEvent.change(screen.getByPlaceholderText('Suche nach Benutzer'), {
      target: { value: 'user@' },
    });

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
  });

  it('lädt über den Aktualisieren-Button neu', async () => {
    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));

    await waitFor(() => expect(userService.getAllUsersWithTokens).toHaveBeenCalledTimes(2));
  });

  it('löscht ein Session-Token nach Bestätigung mit userId und tokenId', async () => {
    userService.deleteUserToken.mockResolvedValue(undefined);

    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Löschen'));
    await confirmDeletion();

    await waitFor(() =>
      expect(userService.deleteUserToken).toHaveBeenCalledWith('jwt-token', 'user-1', 'token-1')
    );
    expect(await screen.findByText('Session-Token wurde gelöscht')).toBeInTheDocument();
    await waitFor(() => expect(userService.getAllUsersWithTokens).toHaveBeenCalledTimes(2));
  });

  it('zeigt die Backend-Meldung, wenn das Löschen fehlschlägt', async () => {
    userService.deleteUserToken.mockRejectedValue(new Error('Nicht gefunden'));

    renderWithProviders(<SessionTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Löschen'));
    await confirmDeletion();

    expect(await screen.findByText('Nicht gefunden')).toBeInTheDocument();
  });
});
