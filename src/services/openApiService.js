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

export function extractTags(spec) {
  return spec?.tags || [];
}

export function filterSpecByTag(spec, tagName) {
  if (!spec || !tagName) return spec;

  const filteredPaths = {};
  
  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    const filteredPathItem = {};
    
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (operation.tags && operation.tags.includes(tagName)) {
        filteredPathItem[method] = operation;
      }
    });

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
