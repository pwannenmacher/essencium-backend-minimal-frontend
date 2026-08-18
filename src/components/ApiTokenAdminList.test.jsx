import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import ApiTokenAdminList from './ApiTokenAdminList';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import { API_TOKEN_STATUS } from '../constants';
import * as apiTokenService from '../services/apiTokenService';

vi.mock('../services/apiTokenService');

const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

// Antwortform des Admin-Endpunkts: Map userId -> Token-Liste
const apiTokensByUser = {
  'user-1': [
    {
      id: 'token-1',
      description: 'CI-Pipeline',
      status: API_TOKEN_STATUS.ACTIVE,
      validUntil: future,
      createdAt: '2026-01-15T10:00:00Z',
      createdBy: 'admin@example.com',
      linkedUser: { name: 'Admin User' },
      rights: [{}, {}, {}],
    },
  ],
  'user-2': [
    {
      id: 'token-2',
      description: 'Alter Token',
      status: API_TOKEN_STATUS.REVOKED,
      updatedAt: '2026-02-01T08:30:00Z',
      createdAt: '2026-01-01T10:00:00Z',
      createdBy: 'user@example.com',
      linkedUser: { name: 'Regular User' },
      rights: [],
    },
  ],
};

async function openRowMenu(rowIndex = 0) {
  const menuButtons = await screen.findAllByRole('button', { name: '' });
  fireEvent.click(menuButtons[rowIndex]);
}

describe('ApiTokenAdminList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiTokenService.getAllApiTokensAdmin.mockResolvedValue(apiTokensByUser);
  });

  afterEach(() => {
    notifications.clean();
  });

  it('lädt die API-Tokens aller Benutzer und zeigt sie', async () => {
    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('CI-Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Alter Token')).toBeInTheDocument();
    expect(screen.getByText('Admin User (admin@example.com)')).toBeInTheDocument();
    expect(apiTokenService.getAllApiTokensAdmin).toHaveBeenCalledWith('jwt-token');
  });

  it('lädt nichts, solange der Tab nicht aktiv ist', () => {
    renderWithProviders(<ApiTokenAdminList active={false} />, {
      authContext: createAuthContext(),
    });

    expect(apiTokenService.getAllApiTokensAdmin).not.toHaveBeenCalled();
  });

  it('zeigt den Empty-State, wenn kein Benutzer Tokens hat', async () => {
    apiTokenService.getAllApiTokensAdmin.mockResolvedValue({});

    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Keine API-Tokens gefunden')).toBeInTheDocument();
  });

  it('zeigt eine Fehler-Notification, wenn das Laden fehlschlägt', async () => {
    apiTokenService.getAllApiTokensAdmin.mockRejectedValue(new Error('Keine Berechtigung'));

    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('API-Tokens konnten nicht geladen werden')).toBeInTheDocument();
  });

  it('unterscheidet aktive und widerrufene Tokens im Status-Badge', async () => {
    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });

    expect(await screen.findByText(/^Aktiv bis/)).toBeInTheDocument();
    expect(screen.getByText(/^Widerrufen \(/)).toBeInTheDocument();
  });

  it('filtert die Tabelle über Benutzer oder Beschreibung', async () => {
    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('CI-Pipeline');

    fireEvent.change(screen.getByPlaceholderText('Suche nach Benutzer oder Beschreibung'), {
      target: { value: 'CI-Pipe' },
    });

    expect(screen.getByText('CI-Pipeline')).toBeInTheDocument();
    expect(screen.queryByText('Alter Token')).not.toBeInTheDocument();
  });

  it('sperrt "Widerrufen" für einen bereits widerrufenen Token', async () => {
    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('Alter Token');

    await openRowMenu(1);

    expect(await screen.findByRole('menuitem', { name: /Widerrufen/ })).toHaveAttribute(
      'data-disabled',
      'true'
    );
  });

  it('widerruft einen aktiven Token nach Bestätigung', async () => {
    apiTokenService.revokeApiToken.mockResolvedValue(undefined);

    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('CI-Pipeline');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Widerrufen'));
    fireEvent.click(await screen.findByRole('button', { name: 'Widerrufen' }));

    await waitFor(() =>
      expect(apiTokenService.revokeApiToken).toHaveBeenCalledWith('jwt-token', 'token-1')
    );
    expect(await screen.findByText('API-Token wurde widerrufen')).toBeInTheDocument();
    await waitFor(() => expect(apiTokenService.getAllApiTokensAdmin).toHaveBeenCalledTimes(2));
  });

  it('löscht einen Token nach Bestätigung und lädt die Liste neu', async () => {
    apiTokenService.deleteApiToken.mockResolvedValue(undefined);

    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('CI-Pipeline');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Löschen'));
    fireEvent.click(await screen.findByRole('button', { name: 'Löschen' }));

    await waitFor(() =>
      expect(apiTokenService.deleteApiToken).toHaveBeenCalledWith('jwt-token', 'token-1')
    );
    expect(await screen.findByText('API-Token wurde gelöscht')).toBeInTheDocument();
    await waitFor(() => expect(apiTokenService.getAllApiTokensAdmin).toHaveBeenCalledTimes(2));
  });

  it('zeigt die Backend-Meldung, wenn das Löschen fehlschlägt', async () => {
    apiTokenService.deleteApiToken.mockRejectedValue(new Error('Nicht gefunden'));

    renderWithProviders(<ApiTokenAdminList active />, { authContext: createAuthContext() });
    await screen.findByText('CI-Pipeline');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Löschen'));
    fireEvent.click(await screen.findByRole('button', { name: 'Löschen' }));

    expect(await screen.findByText('Nicht gefunden')).toBeInTheDocument();
  });
});
