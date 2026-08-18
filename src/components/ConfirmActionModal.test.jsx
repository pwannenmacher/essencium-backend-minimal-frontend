import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmActionModal from './ConfirmActionModal';
import { renderWithProviders } from '../test/helpers';

const noAuth = {
  isAuthenticated: false,
  token: null,
  user: null,
  hasPermission: () => false,
};

function renderModal(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  const onConfirm = props.onConfirm ?? vi.fn();

  renderWithProviders(
    <ConfirmActionModal
      opened
      onClose={onClose}
      onConfirm={onConfirm}
      title="Rolle löschen"
      confirmLabel="Löschen"
      {...props}
    >
      <span>Wirklich löschen?</span>
    </ConfirmActionModal>,
    { authContext: noAuth }
  );

  return { onClose, onConfirm };
}

describe('ConfirmActionModal', () => {
  it('rendert Titel, Inhalt und Buttons', () => {
    renderModal();

    expect(screen.getByText('Rolle löschen')).toBeInTheDocument();
    expect(screen.getByText('Wirklich löschen?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
  });

  it('rendert nichts, wenn opened=false ist', () => {
    renderWithProviders(
      <ConfirmActionModal
        opened={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Rolle löschen"
        confirmLabel="Löschen"
      >
        <span>Wirklich löschen?</span>
      </ConfirmActionModal>,
      { authContext: noAuth }
    );

    expect(screen.queryByText('Wirklich löschen?')).not.toBeInTheDocument();
  });

  it('ruft onClose über Abbrechen auf', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Regression ST8: Doppelklick löste zwei Requests aus.
  it('führt onConfirm bei Doppelklick nur einmal aus', async () => {
    let resolveConfirm;
    const onConfirm = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveConfirm = resolve;
        })
    );
    renderModal({ onConfirm });

    const confirmButton = screen.getByRole('button', { name: 'Löschen' });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);

    resolveConfirm();
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('sperrt Abbrechen, während onConfirm läuft', async () => {
    let resolveConfirm;
    const onConfirm = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveConfirm = resolve;
        })
    );
    const { onClose } = renderModal({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    const cancelButton = screen.getByRole('button', { name: 'Abbrechen' });
    await waitFor(() => expect(cancelButton).toBeDisabled());

    fireEvent.click(cancelButton);
    expect(onClose).not.toHaveBeenCalled();

    resolveConfirm();
    await waitFor(() => expect(cancelButton).not.toBeDisabled());
  });
});
