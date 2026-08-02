import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { renderWithProviders } from '../test/helpers';

function Bomb() {
  throw new Error('Kaboom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React loggt gefangene Render-Fehler nach console.error – Testlog sauber halten
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rendert Kinder, wenn kein Fehler auftritt', () => {
    renderWithProviders(
      <ErrorBoundary>
        <div>Inhalt</div>
      </ErrorBoundary>,
      { authContext: {} }
    );

    expect(screen.getByText('Inhalt')).toBeInTheDocument();
    expect(screen.queryByText('Unerwarteter Fehler')).not.toBeInTheDocument();
  });

  it('zeigt die Fallback-UI, wenn ein Kind beim Rendern wirft', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
      { authContext: {} }
    );

    expect(screen.getByText('Unerwarteter Fehler')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeInTheDocument();
  });

  it('lädt die Seite über den Button neu', () => {
    const reload = vi.fn();
    vi.spyOn(globalThis, 'location', 'get').mockReturnValue({ reload });

    renderWithProviders(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
      { authContext: {} }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Neu laden' }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
