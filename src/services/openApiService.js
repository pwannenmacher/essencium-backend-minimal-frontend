import { API_BASE_URL } from '../config';

/**
 * Service für das Laden der OpenAPI-Dokumentation
 */

/**
 * Lädt die OpenAPI-Spezifikation vom Backend
 * @returns {Promise<Object>} OpenAPI-Spezifikation
 */
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

/**
 * Extrahiert alle Tags (Controller) aus der OpenAPI-Spezifikation
 * @param {Object} spec - OpenAPI-Spezifikation
 * @returns {Array<{name: string, description: string}>} Liste der Tags
 */
export function extractTags(spec) {
  return spec?.tags || [];
}

/**
 * Filtert die OpenAPI-Spezifikation nach einem bestimmten Tag (Controller)
 * @param {Object} spec - Original OpenAPI-Spezifikation
 * @param {string} tagName - Name des Tags zum Filtern
 * @returns {Object} Gefilterte OpenAPI-Spezifikation
 */
export function filterSpecByTag(spec, tagName) {
  if (!spec || !tagName) return spec;

  // Filtere Paths nach dem Tag
  const filteredPaths = {};
  
  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    const filteredPathItem = {};
    
    // Durchlaufe alle HTTP-Methoden (get, post, put, delete, etc.)
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (operation.tags && operation.tags.includes(tagName)) {
        filteredPathItem[method] = operation;
      }
    });

    // Füge den Path nur hinzu, wenn mindestens eine Operation gefunden wurde
    if (Object.keys(filteredPathItem).length > 0) {
      filteredPaths[path] = filteredPathItem;
    }
  });

  return {
    ...spec,
    paths: filteredPaths,
    tags: spec.tags?.filter(tag => tag.name === tagName) || [],
  };
}
