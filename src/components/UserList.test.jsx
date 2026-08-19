import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import UserList from './UserList';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as userService from '../services/userService';
import * as roleService from '../services/roleService';

vi.mock('../services/userService');
vi.mock('../services/roleService');
vi.mock('./UserFormModal', () => ({
  default: ({ opened }) => (opened ? <div>Mock-Benutzer-Formular</div> : null),
}));

const users = [
  {
    id: 'id-1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    enabled: true,
    roles: [{ name: 'ADMIN' }],
  },
  {
    id: 'id-2',
    firstName: 'Regular',
    lastName: 'User',
    email: 'user@example.com',
    enabled: false,
    roles: [{ name: 'USER' }],
  },
];

const page = (content, totalPages = 1) => ({
  content,
  totalPages,
  totalElements: content.length,
});

/** Öffnet das Aktionen-Menü einer Datenzeile (Header-Zeile ist Index 0). */
async function openRowMenu(rowIndex = 0) {
  const rows = await screen.findAllByRole('row');
  fireEvent.click(within(rows[rowIndex + 1]).getByRole('button'));
}

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.getUsers.mockResolvedValue(page(users));
    roleService.getRoles.mockResolvedValue({ content: [{ name: 'ADMIN' }, { name: 'USER' }] });
  });

  afterEach(() => {
    notifications.clean();
  });

  it('lädt Benutzer und Rollen beim Aktivieren und zeigt die Tabelle', async () => {
    renderWithProviders(<UserList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('2 Benutzer')).toBeInTheDocument();
    expect(userService.getUsers).toHaveBeenCalledWith('jwt-token', {
      page: 0,
      size: 10,
      sort: 'email,asc',
    });
    expect(roleService.getRoles).toHaveBeenCalledWith('jwt-token', { size: 100 });
  });

  it('lädt nichts, solange der Tab nicht aktiv ist', () => {
    renderWithProviders(<UserList active={false} />, { authContext: createAuthContext() });

    expect(userService.getUsers).not.toHaveBeenCalled();
    expect(roleService.getRoles).not.toHaveBeenCalled();
  });

  it('kennzeichnet aktive und inaktive Benutzer', async () => {
    renderWithProviders(<UserList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByText('Inaktiv')).toBeInTheDocument();
  });

  it('zeigt den Empty-State, wenn keine Benutzer gefunden werden', async () => {
    userService.getUsers.mockResolvedValue(page([]));

    renderWithProviders(<UserList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Keine Benutzer gefunden')).toBeInTheDocument();
  });

  it('zeigt einen Fehler-Alert, wenn das Laden fehlschlägt', async () => {
    userService.getUsers.mockRejectedValue(new Error('Sitzung abgelaufen'));

    renderWithProviders(<UserList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Sitzung abgelaufen')).toBeInTheDocument();
  });

  // Regression ST1: fetchUsers hing an den Suchfeldern, jeder Tastendruck lud neu.
  it('löst pro Tastendruck im Suchfeld keinen Request aus', async () => {
    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');
    expect(userService.getUsers).toHaveBeenCalledTimes(1);

    const emailInput = screen.getByPlaceholderText('E-Mail suchen...');
    fireEvent.change(emailInput, { target: { value: 'a' } });
    fireEvent.change(emailInput, { target: { value: 'ad' } });
    fireEvent.change(emailInput, { target: { value: 'adm' } });

    expect(userService.getUsers).toHaveBeenCalledTimes(1);
    expect(roleService.getRoles).toHaveBeenCalledTimes(1);
  });

  it('sucht erst auf Klick des Suchen-Buttons und übergibt die Filter', async () => {
    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    fireEvent.change(screen.getByPlaceholderText('E-Mail suchen...'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('Name suchen...'), { target: { value: 'User' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suchen' }));

    await waitFor(() =>
      expect(userService.getUsers).toHaveBeenLastCalledWith('jwt-token', {
        page: 0,
        size: 10,
        sort: 'email,asc',
        email: 'admin',
        name: 'User',
      })
    );
  });

  it('sucht auch per Enter im Suchfeld', async () => {
    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    const emailInput = screen.getByPlaceholderText('E-Mail suchen...');
    fireEvent.change(emailInput, { target: { value: 'admin' } });
    fireEvent.keyDown(emailInput, { key: 'Enter' });

    await waitFor(() =>
      expect(userService.getUsers).toHaveBeenLastCalledWith(
        'jwt-token',
        expect.objectContaining({ email: 'admin' })
      )
    );
  });

  // Regression ST1: der Seitenwechsel sprang auf Seite 0 zurück.
  it('bleibt beim Seitenwechsel auf der gewählten Seite', async () => {
    userService.getUsers.mockResolvedValue(page(users, 3));

    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() =>
      expect(userService.getUsers).toHaveBeenLastCalledWith(
        'jwt-token',
        expect.objectContaining({ page: 1 })
      )
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('data-active', 'true')
    );
    expect(userService.getUsers).toHaveBeenCalledTimes(2);
  });

  it('öffnet das Formular für einen neuen Benutzer', async () => {
    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    fireEvent.click(screen.getByRole('button', { name: /Neuer Benutzer/i }));

    expect(await screen.findByText('Mock-Benutzer-Formular')).toBeInTheDocument();
  });

  it('löscht einen Benutzer nach Bestätigung und lädt die Liste neu', async () => {
    userService.deleteUser.mockResolvedValue(undefined);

    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Löschen'));
    fireEvent.click(await screen.findByRole('button', { name: 'Löschen' }));

    await waitFor(() => expect(userService.deleteUser).toHaveBeenCalledWith('jwt-token', 'id-1'));
    expect(
      await screen.findByText('Benutzer admin@example.com wurde gelöscht')
    ).toBeInTheDocument();
    await waitFor(() => expect(userService.getUsers).toHaveBeenCalledTimes(2));
  });

  it('zeigt die Backend-Meldung, wenn das Löschen fehlschlägt', async () => {
    userService.deleteUser.mockRejectedValue(new Error('Keine Berechtigung für diese Aktion'));

    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Löschen'));
    fireEvent.click(await screen.findByRole('button', { name: 'Löschen' }));

    expect(await screen.findByText('Keine Berechtigung für diese Aktion')).toBeInTheDocument();
  });

  it('beendet die Sessions eines Benutzers', async () => {
    userService.terminateUserSessions.mockResolvedValue(undefined);

    renderWithProviders(<UserList active />, { authContext: createAuthContext() });
    await screen.findByText('admin@example.com');

    await openRowMenu(0);
    fireEvent.click(await screen.findByText('Sessions beenden'));

    await waitFor(() =>
      expect(userService.terminateUserSessions).toHaveBeenCalledWith('jwt-token', 'id-1')
    );
    expect(
      await screen.findByText('Sessions von admin@example.com wurden beendet')
    ).toBeInTheDocument();
  });
});
