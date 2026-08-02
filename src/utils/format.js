/**
 * Gemeinsame Datums-Formatierung der Listen-Komponenten
 * (zuvor in mehreren Komponenten wortgleich dupliziert).
 */

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('de-DE');
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
};

export const isExpired = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};
