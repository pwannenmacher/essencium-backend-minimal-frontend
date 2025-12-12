// Empfohlene Test-Erweiterungen für Login.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { renderWithProviders } from '../test/helpers';
import * as authService from '../services/authService';

vi.mock('../services/authService');

describe('Login Component - OAuth Error Handling', () => {
  const mockCompleteOAuthLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    authService.getOAuthProviders.mockResolvedValue({});
  });

  // WICHTIG: OAuth Error Parameter aus URL
  it('should display error when OAuth redirect contains error parameter', async () => {
    // Mock window.location mit error parameter
    const originalLocation = window.location;
    delete window.location;
    window.location = { 
      search: '?error=access_denied&error_description=User+cancelled+login',
      origin: 'http://localhost:5173',
      assign: vi.fn(),
    };

    renderWithProviders(<Login />, { 
      authContext: { 
        login: vi.fn(),
        completeOAuthLogin: mockCompleteOAuthLogin,
        isAuthenticated: false 
      } 
    });

    await waitFor(() => {
      // Login-Component sollte Fehler anzeigen
      expect(screen.getByText(/zugriff verweigert|fehler/i)).toBeInTheDocument();
    });

    // Cleanup
    window.location = originalLocation;
  });

  // WICHTIG: OAuth Success mit Token aus URL
  it('should complete OAuth login when token is in URL parameter', async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { 
      search: '?token=oauth-jwt-token-12345',
      origin: 'http://localhost:5173',
      assign: vi.fn(),
    };

    renderWithProviders(<Login />, { 
      authContext: { 
        login: vi.fn(),
        completeOAuthLogin: mockCompleteOAuthLogin,
        isAuthenticated: false 
      } 
    });

    await waitFor(() => {
      expect(mockCompleteOAuthLogin).toHaveBeenCalledWith('oauth-jwt-token-12345');
    });

    // Cleanup
    window.location = originalLocation;
  });

  // WICHTIG: OAuth Redirect mit korrekter redirect_uri
  it('should build OAuth URL with correct redirect_uri parameter', async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();
    
    const originalLocation = window.location;
    delete window.location;
    window.location = { 
      assign: assignMock, 
      origin: 'http://localhost:5173',
      search: '',
    };

    authService.getOAuthProviders.mockResolvedValue({
      google: { name: 'Google', url: '/auth/oauth2/authorization/google' },
    });

    renderWithProviders(<Login />, { 
      authContext: { 
        login: vi.fn(), 
        isAuthenticated: false 
      } 
    });

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const googleButton = screen.getByText('Google');
    await user.click(googleButton);

    expect(assignMock).toHaveBeenCalled();
    const callUrl = assignMock.mock.calls[0][0];
    
    // Prüfe dass redirect_uri korrekt encoded ist
    expect(callUrl).toContain('/auth/oauth2/authorization/google');
    expect(callUrl).toContain('redirect_uri=');
    expect(callUrl).toContain(encodeURIComponent('http://localhost:5173'));

    // Cleanup
    window.location = originalLocation;
  });

  // EDGE CASE: Bereits eingeloggt
  it('should not show login form when user is already authenticated', () => {
    renderWithProviders(<Login />, { 
      authContext: { 
        login: vi.fn(),
        isAuthenticated: true,
        user: { email: 'test@example.com' }
      } 
    });

    // Login-Form sollte nicht sichtbar sein
    expect(screen.queryByLabelText(/E-Mail/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /anmelden/i })).not.toBeInTheDocument();
  });

  // EDGE CASE: Network Error bei OAuth Provider Fetch
  it('should handle OAuth provider fetch errors gracefully', async () => {
    authService.getOAuthProviders.mockRejectedValue(
      new Error('Network error')
    );

    renderWithProviders(<Login />, { 
      authContext: { 
        login: vi.fn(),
        isAuthenticated: false 
      } 
    });

    // Component sollte trotzdem rendern, nur ohne OAuth Buttons
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });
});

describe('Login Component - Form Validation', () => {
  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn();

    renderWithProviders(<Login />, { 
      authContext: { 
        login: mockLogin,
        isAuthenticated: false 
      } 
    });

    const emailInput = screen.getByLabelText(/E-Mail/i);
    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    // Ungültige E-Mail eingeben
    await user.type(emailInput, 'invalid-email-format');
    await user.click(submitButton);

    // Mantine sollte Validierungsfehler anzeigen
    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('should show validation error for too short password', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn();

    renderWithProviders(<Login />, { 
      authContext: { 
        login: mockLogin,
        isAuthenticated: false 
      } 
    });

    const emailInput = screen.getByLabelText(/E-Mail/i);
    const passwordInput = screen.getByLabelText(/Passwort/i);
    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12'); // Zu kurz
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });
});
