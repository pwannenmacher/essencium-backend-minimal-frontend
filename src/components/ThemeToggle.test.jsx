import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';
import { renderWithProviders } from '../test/helpers';
import { STORAGE_KEYS } from '../constants';

const noAuth = { isAuthenticated: false, token: null, user: null, hasPermission: () => false };

const renderToggle = () => renderWithProviders(<ThemeToggle />, { authContext: noAuth });

const openMenu = () => fireEvent.click(screen.getByRole('button'));

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('bietet alle drei Theme-Modi an', async () => {
    renderToggle();
    openMenu();

    expect(await screen.findByText('Theme-Modus')).toBeInTheDocument();
    expect(screen.getByText('Hell')).toBeInTheDocument();
    expect(screen.getByText('Dunkel')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('startet im Auto-Modus und markiert ihn', async () => {
    renderToggle();
    openMenu();

    // Der Haken steht in derselben Group wie das Label des aktiven Modus.
    const systemLabel = await screen.findByText('System');
    expect(systemLabel.parentElement).toHaveTextContent('✓');
  });

  it('schreibt die Auswahl "Hell" in den Storage und markiert sie', async () => {
    renderToggle();
    openMenu();

    fireEvent.click(await screen.findByText('Hell'));

    expect(localStorage.getItem(STORAGE_KEYS.THEME_MODE)).toBe('light');
    expect(screen.getByText('Hell').parentElement).toHaveTextContent('✓');
  });

  it('schreibt die Auswahl "Dunkel" in den Storage', async () => {
    renderToggle();
    openMenu();

    fireEvent.click(await screen.findByText('Dunkel'));

    expect(localStorage.getItem(STORAGE_KEYS.THEME_MODE)).toBe('dark');
  });

  it('übernimmt einen bereits gespeicherten Modus', async () => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');

    renderToggle();
    openMenu();

    expect((await screen.findByText('Dunkel')).parentElement).toHaveTextContent('✓');
    expect(screen.getByText('System').parentElement).not.toHaveTextContent('✓');
  });
});
