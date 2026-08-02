import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Referenzstabile Ref auf den aktuellen Access-Token.
 *
 * Für Lade-Callbacks, die bei der automatischen Token-Erneuerung (alle paar
 * Minuten) nicht neu erzeugt werden sollen: Effekte können an der stabilen
 * Callback-Identität hängen, während `.current` immer den aktuellen Token
 * liefert.
 */
export function useAuthTokenRef() {
  const { token } = useAuth();
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  return tokenRef;
}
