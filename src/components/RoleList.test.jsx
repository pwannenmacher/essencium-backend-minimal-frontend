import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import RoleList from './RoleList';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import { RIGHTS } from '../constants';
import * as roleService from '../services/roleService';

vi.mock('../services/roleService');
vi.mock('./RoleFormModal', () => ({
  default: ({ opened }) => (opened ? <div>Mock-Rollen-Formular</div> : null),
}));

const roles = [
  { name: 'ADMIN', description: 'Administrator', editable: true, rights: [{}, {}] },
  { name: 'USER', description: 'Standardrolle', editable: false, rights: [] },
];

/** Aktionen-Menü einer Zeile (0 = ADMIN/editierbar, 1 = USER/geschützt). */
async function openRowMenu(rowIndex = 0) {
  const menuButtons = await screen.findAllByRole('button', { name: '' });
  fireEvent.click(menuButtons[rowIndex]);
}

// findByRole, nicht getByRole: der Modal-Button erscheint erst nach dem Klick.
async function confirmDeletion() {
  fireEvent.click(await screen.findByRole('button', { name: 'Löschen' }));
}

describe('RoleList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roleService.getRoles.mockResolvedValue({ content: roles });
  });

  afterEach(() => {
    notifications.clean();
  });

  it('lädt die Rollen beim Aktivieren und zeigt sie in der Tabelle', async () => {
    renderWithProviders(<RoleList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('USER')).toBeInTheDocument();
    expect(roleService.getRoles).toHaveBeenCalledWith('jwt-token', { size: 100 });
  });

  it('lädt nichts, solange der Tab nicht aktiv ist', () => {
    renderWithProviders(<RoleList active={false} />, { authContext: createAuthContext() });

    expect(roleService.getRoles).not.toHaveBeenCalled();
  });

  it('zeigt den Empty-State, wenn keine Rollen existieren', async () => {
    roleService.getRoles.mockResolvedValue({ content: [] });

    renderWithProviders(<RoleList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Keine Rollen gefunden')).toBeInTheDocument();
  });

  it('zeigt eine Fehler-Notification, wenn das Laden fehlschlägt', async () => {
    roleService.getRoles.mockRejectedValue(new Error('Netzwerkfehler'));

    renderWithProviders(<RoleList active />, { authContext: createAuthContext() });

    expect(await screen.findByText('Rollen konnten nicht geladen werden')).toBeInTheDocument();
  });

  it('filtert die Tabelle über das Suchfeld', async () => {
    renderWithProviders(<RoleList active />, { authContext: createAuthContext() });
    await screen.findByText('ADMIN');

    fireEvent.change(screen.getByPlaceholderText('Suche nach Name oder Beschreibung'), {
      target: { value: 'standard' },
    });

    expect(screen.getByText('USER')).toBeInTheDocument();
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
  });

  it('blendet "Neue Rolle" ohne ROLE_CREATE-Recht aus', async () => {
    renderWithProviders(<RoleList active />, { authContext: createAuthContext() });
    await screen.findByText('ADMIN');

    expect(screen.queryByRole('button', { name: /Neue Rolle/i })).not.toBeInTheDocument();
  });

  it('zeigt "Neue Rolle" mit ROLE_CREATE-Recht und öffnet das Formular', async () => {
    renderWithProviders(<RoleList active />, {
      authContext: createAuthContext({ rights: [RIGHTS.ROLE_CREATE] }),
    });

    const createButton = await screen.findByRole('button', { name: /Neue Rolle/i });
    fireEvent.click(createButton);

    expect(await screen.findByText('Mock-Rollen-Formular')).toBeInTheDocument();
  });

  it('bietet ohne Update-/Delete-Recht kein Aktionen-Menü an', async () => {
    renderWithProviders(<RoleList active />, { authContext: createAuthContext() });
    await screen.findByText('ADMIN');

    // Ohne die beiden Rechte rendert die Aktionen-Spalte gar keinen Button.
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument();
  });

  it('löscht eine Rolle nach Bestätigung und lädt die Liste neu', async () => {
    roleService.deleteRole.mockResolvedValue(undefined);

    renderWithProviders(<RoleList active />, {
      authContext: createAuthContext({ rights: [RIGHTS.ROLE_DELETE] }),
    });
    await screen.findByText('ADMIN');

    await openRowMenu();
    fireEvent.click(await screen.findByText('Löschen'));

    // Der Bestätigungstext ist über mehrere Textknoten verteilt.
    expect(await screen.findByText('Rolle löschen')).toBeInTheDocument();
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/wirklich löschen/)).toBeInTheDocument();

    await confirmDeletion();

    await waitFor(() => expect(roleService.deleteRole).toHaveBeenCalledWith('jwt-token', 'ADMIN'));
    expect(await screen.findByText('Rolle wurde gelöscht')).toBeInTheDocument();
    await waitFor(() => expect(roleService.getRoles).toHaveBeenCalledTimes(2));
  });

  it('sperrt Löschen für eine geschützte (nicht editierbare) Rolle', async () => {
    renderWithProviders(<RoleList active />, {
      authContext: createAuthContext({ rights: [RIGHTS.ROLE_DELETE] }),
    });
    await screen.findByText('USER');

    await openRowMenu(1);

    expect(await screen.findByRole('menuitem', { name: /Löschen/ })).toHaveAttribute(
      'data-disabled',
      'true'
    );
  });

  it('zeigt die Backend-Meldung, wenn das Löschen fehlschlägt', async () => {
    roleService.deleteRole.mockRejectedValue(new Error('Keine Berechtigung für diese Aktion'));

    renderWithProviders(<RoleList active />, {
      authContext: createAuthContext({ rights: [RIGHTS.ROLE_DELETE] }),
    });
    await screen.findByText('ADMIN');

    await openRowMenu();
    fireEvent.click(await screen.findByText('Löschen'));
    await confirmDeletion();

    expect(await screen.findByText('Keine Berechtigung für diese Aktion')).toBeInTheDocument();
  });
});
