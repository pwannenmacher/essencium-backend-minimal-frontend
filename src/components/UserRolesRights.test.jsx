import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import UserRolesRights from './UserRolesRights';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as userService from '../services/userService';

vi.mock('../services/userService');

const render = (authContext = createAuthContext()) =>
  renderWithProviders(<UserRolesRights />, { authContext });

describe('UserRolesRights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('zeigt Rollen und Rechte des angemeldeten Users', async () => {
    userService.getMyRoles.mockResolvedValue([{ name: 'ADMIN' }, { name: 'USER' }]);
    userService.getMyRights.mockResolvedValue([
      { authority: 'ROLE_READ', description: 'Rollen lesen' },
      { authority: 'API_TOKEN' },
    ]);

    render();

    expect(await screen.findByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('USER')).toBeInTheDocument();
    expect(screen.getByText('ROLE_READ')).toBeInTheDocument();
    expect(screen.getByText('Rollen lesen')).toBeInTheDocument();
    expect(screen.getByText('API_TOKEN')).toBeInTheDocument();
  });

  it('verarbeitet Rollen und Rechte auch als reine Strings', async () => {
    userService.getMyRoles.mockResolvedValue(['ADMIN']);
    userService.getMyRights.mockResolvedValue(['API_TOKEN']);

    render();

    expect(await screen.findByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('API_TOKEN')).toBeInTheDocument();
  });

  it('zeigt einen Ladezustand vor der Antwort', () => {
    userService.getMyRoles.mockReturnValue(new Promise(() => {}));
    userService.getMyRights.mockReturnValue(new Promise(() => {}));

    render();

    expect(screen.getByText('Lade Berechtigungen...')).toBeInTheDocument();
  });

  it('meldet leere Listen als "keine zugewiesen"', async () => {
    userService.getMyRoles.mockResolvedValue([]);
    userService.getMyRights.mockResolvedValue([]);

    render();

    expect(await screen.findByText('Keine Rollen zugewiesen')).toBeInTheDocument();
    expect(screen.getByText('Keine Rechte zugewiesen')).toBeInTheDocument();
  });

  it('behandelt eine unerwartete Antwortform defensiv', async () => {
    userService.getMyRoles.mockResolvedValue({ unexpected: true });
    userService.getMyRights.mockResolvedValue(null);

    render();

    expect(await screen.findByText('Keine Rollen zugewiesen')).toBeInTheDocument();
    expect(screen.getByText('Keine Rechte zugewiesen')).toBeInTheDocument();
  });

  it('zeigt die Fehlermeldung, wenn das Laden fehlschlägt', async () => {
    userService.getMyRoles.mockRejectedValue(new Error('Sitzung abgelaufen'));
    userService.getMyRights.mockRejectedValue(new Error('Sitzung abgelaufen'));

    render();

    expect(await screen.findByText('Sitzung abgelaufen')).toBeInTheDocument();
  });

  it('lädt nichts, wenn der User nicht authentifiziert ist', () => {
    render({ ...createAuthContext(), isAuthenticated: false });

    expect(userService.getMyRoles).not.toHaveBeenCalled();
    expect(userService.getMyRights).not.toHaveBeenCalled();
  });
});
