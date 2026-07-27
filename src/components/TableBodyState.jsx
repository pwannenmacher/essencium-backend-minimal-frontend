import { Table, Text } from '@mantine/core';

/**
 * Rendert den Tabellen-Body-Inhalt abhängig vom Ladezustand:
 * - Ladeindikator, wenn `loading`
 * - die übergebenen `rows`, wenn vorhanden
 * - eine Leer-Meldung sonst.
 *
 * Vermeidet verschachtelte Ternaries (S3358) und die Duplikation dieses
 * Musters über mehrere Listen-Komponenten hinweg.
 */
export function renderTableBody({ loading, rows, colSpan, emptyMessage }) {
  if (loading) {
    return (
      <Table.Tr>
        <Table.Td colSpan={colSpan} style={{ textAlign: 'center' }}>
          <Text>Lade...</Text>
        </Table.Td>
      </Table.Tr>
    );
  }

  if (rows.length > 0) {
    return rows;
  }

  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan} style={{ textAlign: 'center' }}>
        <Text>{emptyMessage}</Text>
      </Table.Td>
    </Table.Tr>
  );
}
