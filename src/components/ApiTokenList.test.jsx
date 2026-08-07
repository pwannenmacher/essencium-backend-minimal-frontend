import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import ApiTokenList from './ApiTokenList';
import { renderWithProviders } from '../test/helpers';
import * as apiTokenService from '../services/apiTokenService';

vi.mock('../services/apiTokenService');
vi.mock('./ApiTokenFormModal', () => ({
  default: ({ opened, onClose }) =>
    opened ? (
      <button
        type="button"
        onClick={() => onClose({ token: 'test-token-value', description: 'Test-Token' })}
      >
        Mock-Token-Erstellen
      </button>
    ) : null,
}));

const authContextValue = {
  token: 'jwt-token',
  isAuthenticated: true,
  user: { roles: [] },
  hasPermission: () => false,
};

function mockClipboard(writeText) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    writable: true,
    configurable: true,
  });
}

// Öffnet über den gemockten ApiTokenFormModal das "API-Token erstellt"-Modal
// und liefert dessen Kopier-Button zurück.
async function openCreatedTokenModal() {
  renderWithProviders(<ApiTokenList active />, { authContext: authContextValue });
  fireEvent.click(await screen.findByRole('button', { name: /Neuer API-Token/i }));
  fireEvent.click(await screen.findByRole('button', { name: /Mock-Token-Erstellen/i }));
  return screen.findByRole('button', { name: /In Zwischenablage kopieren/i });
}

describe('ApiTokenList – copyToClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiTokenService.getApiTokens.mockResolvedValue({ content: [] });
  });

  afterEach(() => {
    notifications.clean();
  });

  it('zeigt eine Erfolgs-Notification, wenn das Kopieren gelingt', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    fireEvent.click(await openCreatedTokenModal());

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('test-token-value'));
    expect(
      await screen.findByText('Token wurde in die Zwischenablage kopiert')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Token konnte nicht kopiert werden/)).not.toBeInTheDocument();
  });

  it('zeigt eine Fehler-Notification, wenn das Kopieren fehlschlägt', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard-Zugriff verweigert'));
    mockClipboard(writeText);

    fireEvent.click(await openCreatedTokenModal());

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('test-token-value'));
    expect(
      await screen.findByText('Token konnte nicht kopiert werden – bitte manuell kopieren')
    ).toBeInTheDocument();
    expect(screen.queryByText('Token wurde in die Zwischenablage kopiert')).not.toBeInTheDocument();
  });
});
