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
  const [reloadKey, setReloadKey] = useState(0);

  // Manuelles Neuladen stößt nur den Effect an; das Laden selbst passiert
  // ausschließlich dort, damit Antworten bei Unmount/Tab-Wechsel verworfen
  // werden können und kein setState nach dem Unmount stattfindet.
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!active || !isAuthenticated) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const result = await fetcher(tokenRef.current);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) {
          notifications.show({ title: 'Fehler', message: errorMessage, color: 'red' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, isAuthenticated, reloadKey, fetcher, errorMessage, tokenRef]);

  return { data, loading, reload };
}
