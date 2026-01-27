import { API_BASE_URL } from '../config';

export async function getOpenApiSpec() {
  const response = await fetch(`${API_BASE_URL}/v3/api-docs`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Fehler beim Laden der API-Dokumentation');
  }

  return response.json();
}

