import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import SetPassword from './SetPassword';
import * as resetService from '../services/resetCredentialsService';

vi.mock('../services/resetCredentialsService');

// SetPassword benötigt weder Theme- noch Auth-Context – minimaler Wrapper genügt.
const renderSetPassword = () => render(<SetPassword />, { wrapper: MantineProvider });

const setUrl = (search) => {
  window.history.replaceState({}, '', `/set-password${search}`);
};

describe('SetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an invalid-link message when no token is present', () => {
    setUrl('');
    renderSetPassword();

    expect(screen.getByText('Ungültiger Link')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Neues Passwort/)).not.toBeInTheDocument();
  });

  it('renders the form when a token is present', () => {
    setUrl('?token=reset-abc');
    renderSetPassword();

    expect(screen.getByLabelText(/Neues Passwort/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort bestätigen/)).toBeInTheDocument();
  });

  it('validates that both passwords match', async () => {
    setUrl('?token=reset-abc');
    const user = userEvent.setup();
    renderSetPassword();

    await user.type(screen.getByLabelText(/Neues Passwort/), 'password123');
    await user.type(screen.getByLabelText(/Passwort bestätigen/), 'different123');
    await user.click(screen.getByRole('button', { name: 'Passwort setzen' }));

    expect(await screen.findByText('Passwörter stimmen nicht überein')).toBeInTheDocument();
    expect(resetService.setNewPassword).not.toHaveBeenCalled();
  });

  it('submits the new password with the token and shows success', async () => {
    setUrl('?token=reset-abc');
    resetService.setNewPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderSetPassword();

    await user.type(screen.getByLabelText(/Neues Passwort/), 'password123');
    await user.type(screen.getByLabelText(/Passwort bestätigen/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Passwort setzen' }));

    await waitFor(() =>
      expect(resetService.setNewPassword).toHaveBeenCalledWith('password123', 'reset-abc')
    );
    expect(await screen.findByText('Passwort geändert')).toBeInTheDocument();
  });

  it('shows an error message when the backend rejects the token', async () => {
    setUrl('?token=invalid');
    resetService.setNewPassword.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderSetPassword();

    await user.type(screen.getByLabelText(/Neues Passwort/), 'password123');
    await user.type(screen.getByLabelText(/Passwort bestätigen/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Passwort setzen' }));

    expect(
      await screen.findByText(/Der Link ist möglicherweise ungültig oder abgelaufen/)
    ).toBeInTheDocument();
  });
});
