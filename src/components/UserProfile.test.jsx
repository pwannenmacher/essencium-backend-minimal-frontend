import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import UserProfile from './UserProfile';
import { renderWithProviders, createAuthContext } from '../test/helpers';

vi.mock('./EditProfileModal', () => ({
  default: ({ opened }) => (opened ? <div>Mock-Profil-Formular</div> : null),
}));

const baseUser = {
  id: 42,
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  locale: 'de',
  enabled: true,
  roles: [{ name: 'ADMIN' }, { name: 'USER' }],
};

const render = (user = baseUser, onUpdate = vi.fn()) => {
  renderWithProviders(<UserProfile user={user} onUpdate={onUpdate} />, {
    authContext: createAuthContext(),
  });
  return { onUpdate };
};

describe('UserProfile', () => {
  it('zeigt die Kerndaten des Users', () => {
    render();

    expect(screen.getByText('Benutzerprofil')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('de')).toBeInTheDocument();
    expect(screen.getByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('USER')).toBeInTheDocument();
  });

  it('rendert nichts ohne User', () => {
    renderWithProviders(<UserProfile user={null} onUpdate={vi.fn()} />, {
      authContext: createAuthContext(),
    });

    expect(screen.queryByText('Benutzerprofil')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bearbeiten/i })).not.toBeInTheDocument();
  });

  it('kennzeichnet einen deaktivierten User', () => {
    render({ ...baseUser, enabled: false });

    expect(screen.getByText('Deaktiviert')).toBeInTheDocument();
    expect(screen.queryByText('Aktiv')).not.toBeInTheDocument();
  });

  it('blendet optionale Felder aus, wenn sie fehlen', () => {
    render();

    expect(screen.queryByText('Telefon:')).not.toBeInTheDocument();
    expect(screen.queryByText('Mobil:')).not.toBeInTheDocument();
    expect(screen.queryByText('Quelle:')).not.toBeInTheDocument();
    expect(screen.queryByText('Login deaktiviert')).not.toBeInTheDocument();
  });

  it('zeigt optionale Felder, wenn sie gesetzt sind', () => {
    render({
      ...baseUser,
      phone: '+49 30 123',
      mobile: '+49 170 456',
      source: 'ldap',
      loginDisabled: true,
    });

    expect(screen.getByText('+49 30 123')).toBeInTheDocument();
    expect(screen.getByText('+49 170 456')).toBeInTheDocument();
    expect(screen.getByText('ldap')).toBeInTheDocument();
    expect(screen.getByText('Login deaktiviert')).toBeInTheDocument();
  });

  it('blendet den Rollen-Block ohne Rollen aus', () => {
    render({ ...baseUser, roles: [] });

    expect(screen.queryByText('Rollen:')).not.toBeInTheDocument();
  });

  it('öffnet das Bearbeiten-Formular', async () => {
    render();

    fireEvent.click(screen.getByRole('button', { name: /Bearbeiten/i }));

    expect(await screen.findByText('Mock-Profil-Formular')).toBeInTheDocument();
  });
});
