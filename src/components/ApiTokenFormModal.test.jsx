import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import ApiTokenFormModal from './ApiTokenFormModal';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as apiTokenService from '../services/apiTokenService';

vi.mock('../services/apiTokenService');

/** User mit zwei Rollen, deren Rechte sich überschneiden (Dedup-Fall). */
const userWithRights = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  roles: [
    { name: 'ADMIN', rights: [{ authority: 'API_TOKEN' }, { authority: 'ROLE_READ' }] },
    { name: 'EDITOR', rights: [{ authority: 'ROLE_READ' }] },
  ],
};

function renderModal({ opened = true, onClose = vi.fn(), user = userWithRights } = {}) {
  renderWithProviders(<ApiTokenFormModal opened={opened} onClose={onClose} />, {
    authContext: createAuthContext({ user }),
  });
  return { onClose };
}

const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('ApiTokenFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiTokenService.getTokenExpirationInfo.mockResolvedValue(null);
    apiTokenService.createApiToken.mockResolvedValue({ token: 'geheim', description: 'CI' });
  });

  afterEach(() => {
    notifications.clean();
  });

  it('rendert nichts, solange das Modal geschlossen ist', () => {
    renderModal({ opened: false });

    expect(screen.queryByText('Neuer API-Token')).not.toBeInTheDocument();
    expect(apiTokenService.getTokenExpirationInfo).not.toHaveBeenCalled();
  });

  it('zeigt die Rechte des Users dedupliziert an', async () => {
    renderModal();

    expect(await screen.findByLabelText('API_TOKEN')).toBeInTheDocument();
    expect(screen.getAllByLabelText('ROLE_READ')).toHaveLength(1);
  });

  it('weist auf fehlende Rechte hin, wenn der User keine hat', () => {
    renderModal({ user: { ...userWithRights, roles: [] } });

    expect(
      screen.getByText('Sie haben keine Rechte, die Sie einem Token zuweisen können.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alle auswählen' })).toBeDisabled();
  });

  it('zeigt die Default-Laufzeit aus dem Backend lesbar an', async () => {
    apiTokenService.getTokenExpirationInfo.mockResolvedValue(90 * 86400);

    renderModal();

    expect(
      await screen.findByText('Ohne Angabe wird der Token für 90 Tage gültig sein')
    ).toBeInTheDocument();
  });

  it('formatiert eine gemischte Laufzeit mit Stunden und Minuten', async () => {
    apiTokenService.getTokenExpirationInfo.mockResolvedValue(86400 + 3600 + 60);

    renderModal();

    expect(
      await screen.findByText(
        'Ohne Angabe wird der Token für 1 Tag, 1 Stunde, 1 Minute gültig sein'
      )
    ).toBeInTheDocument();
  });

  it('fällt auf den Hinweistext zurück, wenn keine Info kommt', async () => {
    renderModal();

    expect(
      await screen.findByText('Ohne Angabe wird eine variable Default-Laufzeit vergeben')
    ).toBeInTheDocument();
  });

  it('erstellt einen Token und gibt das Ergebnis an onClose', async () => {
    const { onClose } = renderModal();
    await screen.findByLabelText('API_TOKEN');

    fill(/Beschreibung/, 'CI-Pipeline');
    fireEvent.click(screen.getByLabelText('API_TOKEN'));
    fireEvent.click(screen.getByRole('button', { name: 'Erstellen' }));

    await waitFor(() =>
      expect(apiTokenService.createApiToken).toHaveBeenCalledWith('jwt-token', {
        description: 'CI-Pipeline',
        validUntil: null,
        rights: ['API_TOKEN'],
      })
    );
    expect(await screen.findByText('API-Token wurde erstellt')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledWith({ token: 'geheim', description: 'CI' });
  });

  it('wählt alle Rechte aus und wieder ab', async () => {
    renderModal();
    await screen.findByLabelText('API_TOKEN');

    fireEvent.click(screen.getByRole('button', { name: 'Alle auswählen' }));
    expect(screen.getByText('Rechte (2 ausgewählt)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Alle abwählen' }));
    expect(screen.getByText('Rechte (0 ausgewählt)')).toBeInTheDocument();
  });

  it('nimmt ein Recht durch nochmaliges Klicken wieder heraus', async () => {
    renderModal();
    const checkbox = await screen.findByLabelText('API_TOKEN');

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('erstellt keinen Token ohne Beschreibung', async () => {
    renderModal();
    await screen.findByLabelText('API_TOKEN');

    fireEvent.click(screen.getByRole('button', { name: 'Erstellen' }));

    expect(apiTokenService.createApiToken).not.toHaveBeenCalled();
  });

  it('zeigt die Backend-Meldung, wenn das Erstellen fehlschlägt', async () => {
    apiTokenService.createApiToken.mockRejectedValue(new Error('Keine Berechtigung'));
    const { onClose } = renderModal();
    await screen.findByLabelText('API_TOKEN');

    fill(/Beschreibung/, 'CI-Pipeline');
    fireEvent.click(screen.getByRole('button', { name: 'Erstellen' }));

    expect(await screen.findByText('Keine Berechtigung')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('schließt über Abbrechen ohne Ergebnis', async () => {
    const { onClose } = renderModal();
    await screen.findByLabelText('API_TOKEN');

    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onClose).toHaveBeenCalledWith();
  });

  it('meldet keinen Fehler, wenn die Expiration-Info nicht ladbar ist', async () => {
    apiTokenService.getTokenExpirationInfo.mockRejectedValue(new Error('kaputt'));

    renderModal();

    expect(
      await screen.findByText('Ohne Angabe wird eine variable Default-Laufzeit vergeben')
    ).toBeInTheDocument();
  });
});
