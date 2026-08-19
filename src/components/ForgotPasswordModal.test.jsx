import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { renderWithProviders } from '../test/helpers';
import * as resetCredentialsService from '../services/resetCredentialsService';

vi.mock('../services/resetCredentialsService');

const noAuth = { isAuthenticated: false, token: null, user: null, hasPermission: () => false };

function renderModal({ opened = true, onClose = vi.fn() } = {}) {
  renderWithProviders(<ForgotPasswordModal opened={opened} onClose={onClose} />, {
    authContext: noAuth,
  });
  return { onClose };
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Link anfordern' }));

const enterEmail = (value) =>
  fireEvent.change(screen.getByLabelText(/E-Mail/), { target: { value } });

describe('ForgotPasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCredentialsService.requestPasswordReset.mockResolvedValue(undefined);
  });

  it('rendert nichts, wenn opened=false ist', () => {
    renderModal({ opened: false });

    expect(screen.queryByRole('button', { name: 'Link anfordern' })).not.toBeInTheDocument();
  });

  // required blockt den Submit; Mantines Validator läuft hier nicht.
  it('schickt bei leerem Feld keine Anfrage', () => {
    renderModal();

    expect(screen.getByLabelText(/E-Mail/)).toBeRequired();
    submit();

    expect(resetCredentialsService.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('lehnt eine syntaktisch ungültige Adresse ab', async () => {
    renderModal();

    enterEmail('kein-at-zeichen');
    submit();

    expect(await screen.findByText('Ungültige E-Mail-Adresse')).toBeInTheDocument();
    expect(resetCredentialsService.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('fordert den Reset-Link an und zeigt die Bestätigung', async () => {
    renderModal();

    enterEmail('user@example.com');
    submit();

    await waitFor(() =>
      expect(resetCredentialsService.requestPasswordReset).toHaveBeenCalledWith('user@example.com')
    );
    expect(await screen.findByText('E-Mail versendet')).toBeInTheDocument();
  });

  // Kein User-Enumeration: gleiche Bestätigung auch im Fehlerfall.
  it('zeigt dieselbe Bestätigung, wenn das Backend einen Fehler liefert', async () => {
    resetCredentialsService.requestPasswordReset.mockRejectedValue(new Error('Anfrage 500'));
    renderModal();

    enterEmail('unbekannt@example.com');
    submit();

    expect(await screen.findByText('E-Mail versendet')).toBeInTheDocument();
    expect(screen.queryByText(/Anfrage 500/)).not.toBeInTheDocument();
  });

  it('setzt den Zustand beim Schließen zurück', async () => {
    const { onClose } = renderModal();

    enterEmail('user@example.com');
    submit();
    await screen.findByText('E-Mail versendet');

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('E-Mail versendet')).not.toBeInTheDocument();
  });
});
