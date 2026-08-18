import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import UserFormModal from './UserFormModal';
import { renderWithProviders, createAuthContext } from '../test/helpers';

const roles = [{ name: 'ADMIN' }, { name: 'USER' }];

const existingUser = {
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  locale: 'en',
  roles: [{ name: 'ADMIN' }],
  enabled: false,
  loginDisabled: true,
  phone: '+49 30 123',
  mobile: '',
};

function renderModal({ mode = 'create', user = null, onSubmit, onClose = vi.fn() } = {}) {
  const submit = onSubmit ?? vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <UserFormModal
      opened
      onClose={onClose}
      onSubmit={submit}
      user={user}
      roles={roles}
      mode={mode}
    />,
    { authContext: createAuthContext() }
  );
  return { onSubmit: submit, onClose };
}

const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

// Über den Placeholder, weil byLabelText beim MultiSelect mehrdeutig ist.
const pickOption = async (placeholder, option) => {
  fireEvent.click(screen.getByPlaceholderText(placeholder));
  fireEvent.click(await screen.findByRole('option', { name: option }));
};

const submitForm = (name) => fireEvent.click(screen.getByRole('button', { name }));

describe('UserFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('zeigt im Create-Modus Titel, Passwortfeld und Erstellen-Button', () => {
    renderModal();

    expect(screen.getByText('Neuen Benutzer erstellen')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Passwort/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Erstellen' })).toBeInTheDocument();
  });

  it('zeigt im Edit-Modus ein optionales Passwortfeld und Speichern', () => {
    renderModal({ mode: 'edit', user: existingUser });

    expect(screen.getByText('Benutzer bearbeiten')).toBeInTheDocument();
    expect(screen.getByLabelText(/Neues Passwort/)).not.toBeRequired();
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
  });

  it('füllt im Edit-Modus die Felder aus dem User', () => {
    renderModal({ mode: 'edit', user: existingUser });

    expect(screen.getByLabelText(/E-Mail/)).toHaveValue('admin@example.com');
    expect(screen.getByLabelText(/Vorname/)).toHaveValue('Admin');
    expect(screen.getByLabelText(/Nachname/)).toHaveValue('User');
    expect(screen.getByLabelText(/Telefon/)).toHaveValue('+49 30 123');
    expect(screen.getByLabelText('Benutzer aktiviert')).not.toBeChecked();
    expect(screen.getByLabelText('Login deaktiviert')).toBeChecked();
  });

  it('lehnt eine syntaktisch ungültige E-Mail ab', async () => {
    const { onSubmit } = renderModal();

    fill(/E-Mail/, 'kein-at-zeichen');
    fill(/Vorname/, 'Max');
    fill(/Nachname/, 'Mustermann');
    fill(/^Passwort/, 'sicheresPasswort1');
    submitForm('Erstellen');

    expect(await screen.findByText('Ungültige E-Mail-Adresse')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('verlangt mindestens eine Rolle', async () => {
    const { onSubmit } = renderModal();

    fill(/E-Mail/, 'neu@example.com');
    fill(/Vorname/, 'Max');
    fill(/Nachname/, 'Mustermann');
    fill(/^Passwort/, 'sicheresPasswort1');
    submitForm('Erstellen');

    expect(await screen.findByText('Mindestens eine Rolle ist erforderlich')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('übergibt die eingegebenen Werte an onSubmit und schließt', async () => {
    const { onSubmit, onClose } = renderModal();

    fill(/E-Mail/, 'neu@example.com');
    fill(/Vorname/, 'Max');
    fill(/Nachname/, 'Mustermann');
    fill(/^Passwort/, 'sicheresPasswort1');
    await pickOption('Rollen auswählen', 'USER');
    submitForm('Erstellen');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'neu@example.com',
          firstName: 'Max',
          lastName: 'Mustermann',
          password: 'sicheresPasswort1',
          locale: 'de',
          roles: ['USER'],
          enabled: true,
          loginDisabled: false,
        })
      )
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Im Edit-Modus darf ein leeres Passwortfeld das Passwort nicht überschreiben.
  it('lässt das Passwort im Edit-Modus weg, wenn das Feld leer bleibt', async () => {
    const { onSubmit } = renderModal({ mode: 'edit', user: existingUser });

    submitForm('Speichern');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('password');
  });

  it('sendet das Passwort im Edit-Modus, wenn es ausgefüllt wurde', async () => {
    const { onSubmit } = renderModal({ mode: 'edit', user: existingUser });

    fill(/Neues Passwort/, 'ganzNeuesPasswort1');
    submitForm('Speichern');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'ganzNeuesPasswort1' })
      )
    );
  });

  it('zeigt den Fehler aus onSubmit und bleibt offen', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('E-Mail bereits vergeben'));
    const { onClose } = renderModal({ mode: 'edit', user: existingUser, onSubmit });

    submitForm('Speichern');

    expect(await screen.findByText('E-Mail bereits vergeben')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('schließt über Abbrechen', () => {
    const { onClose, onSubmit } = renderModal();

    submitForm('Abbrechen');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
