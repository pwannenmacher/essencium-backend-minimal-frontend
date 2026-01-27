import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { renderWithProviders } from '../test/helpers';
import * as authService from '../services/authService';

vi.mock('../services/authService');
const generateTestPassword = () =>
  `testPwd_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
const TEST_PASSWORD = generateTestPassword();
const TEST_PASSWORD_WRONG = generateTestPassword();

describe('Login Component', () => {
  const mockLogin = vi.fn();
  const mockCompleteOAuthLogin = vi.fn();

  const authContextValue = {
    login: mockLogin,
    completeOAuthLogin: mockCompleteOAuthLogin,
    user: null,
    token: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService.getOAuthProviders.mockResolvedValue({});
  });

  it('should render login form', () => {
    renderWithProviders(<Login />, { authContext: authContextValue });

    expect(screen.getByText('Essencium Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument();
  });

  it('should call login with username and password', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true });
    const user = userEvent.setup();

    renderWithProviders(<Login />, {
      authContext: {
        login: mockLogin,
        isAuthenticated: false,
      },
    });

    const emailInput = screen.getByLabelText(/E-Mail/i);
    const passwordInput = screen.getByLabelText(/Passwort/i);
    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, TEST_PASSWORD);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', TEST_PASSWORD);
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Login />, { authContext: authContextValue });

    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    await user.click(submitButton);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should show OAuth providers when available', async () => {
    authService.getOAuthProviders.mockResolvedValue({
      google: { name: 'Google', url: '/auth/oauth2/authorization/google' },
      github: { name: 'GitHub', url: '/auth/oauth2/authorization/github' },
    });

    renderWithProviders(<Login />, { authContext: authContextValue });

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });

  it('should handle OAuth login click', async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();

    delete window.location;
    window.location = { assign: assignMock, origin: 'http://localhost:5173' };

    authService.getOAuthProviders.mockResolvedValue({
      google: { name: 'Google', url: '/auth/oauth2/authorization/google' },
    });

    renderWithProviders(<Login />, { authContext: authContextValue });

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const googleButton = screen.getByText('Google');
    await user.click(googleButton);

    expect(assignMock).toHaveBeenCalled();
    const callUrl = assignMock.mock.calls[0][0];
    expect(callUrl).toContain('/auth/oauth2/authorization/google');
    expect(callUrl).toContain('redirect_uri=');
  });

  it('should display error message on failed login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: false,
      error: 'Login fehlgeschlagen',
    });
    const user = userEvent.setup();

    renderWithProviders(<Login />, {
      authContext: { login: mockLogin, isAuthenticated: false },
    });

    const usernameInput = screen.getByLabelText(/E-Mail/i);
    const passwordInput = screen.getByLabelText(/passwort/i);
    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    await user.type(usernameInput, 'wronguser');
    await user.type(passwordInput, TEST_PASSWORD_WRONG);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login fehlgeschlagen/i)).toBeInTheDocument();
    });

    expect(mockLogin).toHaveBeenCalledWith('wronguser', TEST_PASSWORD_WRONG);
  });
});
