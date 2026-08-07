import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { useAuthTokenRef } from './useAuthTokenRef';

/**
 * Gemeinsames Lade-Muster der Listen-Komponenten (zuvor 4× dupliziert):
 * lädt beim Aktivieren des Tabs, hält den Loading-State und zeigt bei
 * Fehlern eine Notification.
 *
 * `fetcher` muss referenzstabil sein (auf Modulebene definieren) und
 * erhält den aktuellen Access-Token.
 */
export function useListLoader({ active, fetcher, errorMessage, initialData }) {
  const { isAuthenticated } = useAuth();
  const tokenRef = useAuthTokenRef();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetcher(tokenRef.current));
    } catch {
      notifications.show({ title: 'Fehler', message: errorMessage, color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [fetcher, errorMessage, tokenRef]);

  useEffect(() => {
    if (active && isAuthenticated) {
      reload();
    }
  }, [active, isAuthenticated, reload]);

  return { data, loading, reload };
}
