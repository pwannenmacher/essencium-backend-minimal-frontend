import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import RoleFormModal from './RoleFormModal';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as roleService from '../services/roleService';

vi.mock('../services/roleService');

const rightsPage = (authorities, totalPages = 1) => ({
  content: authorities.map((authority) => ({ authority })),
  totalPages,
});

function renderModal({ opened = true, role = null, onClose = vi.fn() } = {}) {
  renderWithProviders(<RoleFormModal opened={opened} onClose={onClose} role={role} />, {
    authContext: createAuthContext(),
  });
  return { onClose };
}

const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('RoleFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roleService.getAllRights.mockResolvedValue(rightsPage(['ROLE_READ', 'ROLE_CREATE']));
    roleService.createRole.mockResolvedValue({});
    roleService.updateRole.mockResolvedValue({});
  });

  afterEach(() => {
    notifications.clean();
  });

  it('lädt die verfügbaren Rechte beim Öffnen', async () => {
    renderModal();

    expect(await screen.findByLabelText('ROLE_READ')).toBeInTheDocument();
    expect(screen.getByLabelText('ROLE_CREATE')).toBeInTheDocument();
    expect(roleService.getAllRights).toHaveBeenCalledWith('jwt-token', {
      page: 0,
      size: 100,
      sort: 'authority',
    });
  });

  it('lädt nichts, solange das Modal geschlossen ist', () => {
    renderModal({ opened: false });

    expect(roleService.getAllRights).not.toHaveBeenCalled();
  });

  // Der Endpunkt ist paginiert; alle Seiten müssen eingesammelt werden.
  it('sammelt Rechte über alle Seiten ein', async () => {
    roleService.getAllRights
      .mockResolvedValueOnce(rightsPage(['A_RIGHT'], 2))
      .mockResolvedValueOnce(rightsPage(['B_RIGHT'], 2));

    renderModal();

    expect(await screen.findByLabelText('A_RIGHT')).toBeInTheDocument();
    expect(screen.getByLabelText('B_RIGHT')).toBeInTheDocument();
    expect(roleService.getAllRights).toHaveBeenCalledTimes(2);
  });

  it('meldet einen Fehler, wenn die Rechte nicht geladen werden können', async () => {
    roleService.getAllRights.mockRejectedValue(new Error('kaputt'));

    renderModal();

    expect(await screen.findByText('Rechte konnten nicht geladen werden')).toBeInTheDocument();
    expect(await screen.findByText('Keine Rechte verfügbar.')).toBeInTheDocument();
  });

  it('erstellt eine neue Rolle mit den gewählten Rechten', async () => {
    const { onClose } = renderModal();
    await screen.findByLabelText('ROLE_READ');

    fill(/^Name/, 'EDITOR');
    fill(/Beschreibung/, 'Darf Inhalte bearbeiten');
    fireEvent.click(screen.getByLabelText('ROLE_READ'));
    fireEvent.click(screen.getByRole('button', { name: 'Erstellen' }));

    await waitFor(() =>
      expect(roleService.createRole).toHaveBeenCalledWith('jwt-token', {
        name: 'EDITOR',
        description: 'Darf Inhalte bearbeiten',
        rights: ['ROLE_READ'],
      })
    );
    expect(await screen.findByText('Rolle wurde erstellt')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sperrt den Namen im Edit-Modus und aktualisiert die Rolle', async () => {
    const role = { name: 'ADMIN', description: 'Administrator', rights: ['ROLE_READ'] };
    renderModal({ role });
    await screen.findByLabelText('ROLE_READ');

    expect(screen.getByText('Rolle bearbeiten')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toBeDisabled();
    expect(screen.getByLabelText('ROLE_READ')).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));

    await waitFor(() =>
      expect(roleService.updateRole).toHaveBeenCalledWith('jwt-token', 'ADMIN', {
        name: 'ADMIN',
        description: 'Administrator',
        rights: ['ROLE_READ'],
      })
    );
    expect(await screen.findByText('Rolle wurde aktualisiert')).toBeInTheDocument();
  });

  it('nimmt ein Recht durch nochmaliges Klicken wieder heraus', async () => {
    renderModal();
    const checkbox = await screen.findByLabelText('ROLE_READ');

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('wählt alle Rechte aus und wieder ab', async () => {
    renderModal();
    await screen.findByLabelText('ROLE_READ');

    fireEvent.click(screen.getByRole('button', { name: 'Alle auswählen' }));
    expect(screen.getByLabelText('ROLE_READ')).toBeChecked();
    expect(screen.getByLabelText('ROLE_CREATE')).toBeChecked();
    expect(screen.getByText('Rechte (2 ausgewählt)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Alle abwählen' }));
    expect(screen.getByLabelText('ROLE_READ')).not.toBeChecked();
    expect(screen.getByText('Rechte (0 ausgewählt)')).toBeInTheDocument();
  });

  it('verlangt eine Beschreibung', async () => {
    renderModal();
    await screen.findByLabelText('ROLE_READ');

    fill(/^Name/, 'EDITOR');
    fireEvent.click(screen.getByRole('button', { name: 'Erstellen' }));

    expect(roleService.createRole).not.toHaveBeenCalled();
  });

  it('zeigt die Backend-Meldung, wenn das Speichern fehlschlägt', async () => {
    roleService.createRole.mockRejectedValue(new Error('Konflikt – Name schon vergeben'));
    const { onClose } = renderModal();
    await screen.findByLabelText('ROLE_READ');

    fill(/^Name/, 'EDITOR');
    fill(/Beschreibung/, 'Darf Inhalte bearbeiten');
    fireEvent.click(screen.getByRole('button', { name: 'Erstellen' }));

    expect(await screen.findByText('Konflikt – Name schon vergeben')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('schließt über Abbrechen', async () => {
    const { onClose } = renderModal();
    await screen.findByLabelText('ROLE_READ');

    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
