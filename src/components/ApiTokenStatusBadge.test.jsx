import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import ApiTokenStatusBadge from './ApiTokenStatusBadge';
import { renderWithProviders } from '../test/helpers';
import { API_TOKEN_STATUS } from '../constants';

const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const renderBadge = (apiToken) =>
  renderWithProviders(<ApiTokenStatusBadge apiToken={apiToken} />, {
    authContext: { isAuthenticated: false, token: null, user: null, hasPermission: () => false },
  });

describe('ApiTokenStatusBadge', () => {
  it('zeigt bei aktivem Token die Gültigkeit', () => {
    renderBadge({ status: API_TOKEN_STATUS.ACTIVE, validUntil: future });

    expect(screen.getByText(/^Aktiv bis/)).toBeInTheDocument();
  });

  it('behandelt einen Token ohne Status wie einen aktiven', () => {
    renderBadge({ validUntil: future });

    expect(screen.getByText(/^Aktiv bis/)).toBeInTheDocument();
  });

  it('zeigt einen aktiven Token mit abgelaufener Gültigkeit als abgelaufen', () => {
    renderBadge({ status: API_TOKEN_STATUS.ACTIVE, validUntil: past });

    expect(screen.getByText(/^Abgelaufen \(/)).toBeInTheDocument();
  });

  it.each([
    [API_TOKEN_STATUS.REVOKED, /^Widerrufen \(/],
    [API_TOKEN_STATUS.REVOKED_ROLE_CHANGED, /Rolle geändert/],
    [API_TOKEN_STATUS.REVOKED_RIGHTS_CHANGED, /Rechte geändert/],
    [API_TOKEN_STATUS.REVOKED_USER_CHANGED, /Nutzer geändert/],
  ])('beschriftet den Status %s passend', (status, expected) => {
    renderBadge({ status, updatedAt: past });

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('zeigt EXPIRED ohne Datum an', () => {
    renderBadge({ status: API_TOKEN_STATUS.EXPIRED });

    expect(screen.getByText('Abgelaufen')).toBeInTheDocument();
  });

  it('zeigt USER_DELETED an', () => {
    renderBadge({ status: API_TOKEN_STATUS.USER_DELETED });

    expect(screen.getByText('Nutzer gelöscht')).toBeInTheDocument();
  });

  it('zeigt einen unbekannten Status im Klartext', () => {
    renderBadge({ status: 'SOMETHING_NEW' });

    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
  });
});
