import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import EditProfileModal from './EditProfileModal';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as userService from '../services/userService';

vi.mock('../services/userService');

const user = {
  id: 42,
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  phone: '+49 30 123',
  mobile: '',
  locale: 'de',
  roles: [{ name: 'ADMIN', rights: [] }],
};

function renderModal({ opened = true, onClose = vi.fn(), onSuccess = vi.fn() } = {}) {
  renderWithProviders(
    <EditProfileModal opened={opened} onClose={onClose} onSuccess={onSuccess} />,
    { authContext: createAuthContext({ user }) }
  );
  return { onClose, onSuccess };
}

const switchToPasswordTab = () =>
  fireEvent.click(screen.getByRole('tab', { name: /Passwort ändern/i }));

describe('EditProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.patchMe.mockResolvedValue({});
    userService.updateMyPassword.mockResolvedValue({});
  });

  afterEach(() => {
    notifications.clean();
  });

  it('rendert nichts, wenn opened=false ist', () => {
    renderModal({ opened: false });

    expect(screen.queryByText('Mein Profil bearbeiten')).not.toBeInTheDocument();
  });

  it('füllt die Profilfelder aus dem AuthContext vor', () => {
    renderModal();

    expect(screen.getByLabelText(/Vorname/)).toHaveValue('Admin');
    expect(screen.getByLabelText(/Nachname/)).toHaveValue('User');
    expect(screen.getByLabelText(/Telefon/)).toHaveValue('+49 30 123');
  });

  it('speichert Profiländerungen per PATCH und meldet Erfolg', async () => {
    const { onClose, onSuccess } = renderModal();

    fireEvent.change(screen.getByLabelText(/Vorname/), { target: { value: 'Neuer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() =>
      expect(userService.patchMe).toHaveBeenCalledWith(
        'jwt-token',
        expect.objectContaining({ firstName: 'Neuer', lastName: 'User' }),
        42
      )
    );
    expect(await screen.findByText('Profil wurde aktualisiert')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // required blockt den Submit; Mantines Validator läuft hier nicht.
  it('speichert nicht, wenn der Vorname leer ist', () => {
    renderModal();

    const firstName = screen.getByLabelText(/Vorname/);
    expect(firstName).toBeRequired();

    fireEvent.change(firstName, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(userService.patchMe).not.toHaveBeenCalled();
  });

  it('zeigt die Backend-Meldung, wenn das Speichern fehlschlägt', async () => {
    userService.patchMe.mockRejectedValue(new Error('Konflikt – die Daten wurden geändert'));
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByText('Konflikt – die Daten wurden geändert')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ändert das Passwort und meldet Erfolg', async () => {
    const { onClose } = renderModal();
    switchToPasswordTab();

    fireEvent.change(await screen.findByLabelText(/Neues Passwort/), {
      target: { value: 'sicheresPasswort1' },
    });
    fireEvent.change(screen.getByLabelText(/Passwort bestätigen/), {
      target: { value: 'sicheresPasswort1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ändern' }));

    await waitFor(() =>
      expect(userService.updateMyPassword).toHaveBeenCalledWith('jwt-token', {
        password: 'sicheresPasswort1',
        verification: 'sicheresPasswort1',
      })
    );
    expect(await screen.findByText('Passwort wurde geändert')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lehnt ein zu kurzes Passwort ab', async () => {
    renderModal();
    switchToPasswordTab();

    fireEvent.change(await screen.findByLabelText(/Neues Passwort/), { target: { value: 'kurz' } });
    fireEvent.change(screen.getByLabelText(/Passwort bestätigen/), { target: { value: 'kurz' } });
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ändern' }));

    expect(await screen.findByText('Mindestens 8 Zeichen')).toBeInTheDocument();
    expect(userService.updateMyPassword).not.toHaveBeenCalled();
  });

  it('lehnt eine abweichende Bestätigung ab', async () => {
    renderModal();
    switchToPasswordTab();

    fireEvent.change(await screen.findByLabelText(/Neues Passwort/), {
      target: { value: 'sicheresPasswort1' },
    });
    fireEvent.change(screen.getByLabelText(/Passwort bestätigen/), {
      target: { value: 'etwasAnderes1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ändern' }));

    expect(await screen.findByText('Passwörter stimmen nicht überein')).toBeInTheDocument();
    expect(userService.updateMyPassword).not.toHaveBeenCalled();
  });

  it('schließt über Abbrechen', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getAllByRole('button', { name: 'Abbrechen' })[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
