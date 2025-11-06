import { useState, useEffect, useContext } from 'react';
import { Table, TextInput, Group, Menu, ActionIcon, Text, Modal, Badge, Card, Stack, Button } from '@mantine/core';
import { IconSearch, IconDots, IconTrash, IconUser } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AuthContext } from '../context/AuthContext';
import { getAllApiTokensAdmin, deleteApiToken } from '../services/apiTokenService';

export default function ApiTokenAdminList({ active }) {
  const { token } = useContext(AuthContext);
  const [apiTokensByUser, setApiTokensByUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);

  const loadApiTokens = async () => {
    setLoading(true);
    try {
      const response = await getAllApiTokensAdmin(token);
      setApiTokensByUser(response || {});
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: 'API-Tokens konnten nicht geladen werden',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Lade Daten nur wenn Tab aktiv ist
  useEffect(() => {
    if (active && token) {
      loadApiTokens();
    }
  }, [active, token]);

  const handleDelete = async () => {
    try {
      await deleteApiToken(token, tokenToDelete.token.id);
      notifications.show({
        title: 'Erfolg',
        message: 'API-Token wurde gelöscht',
        color: 'green',
      });
      loadApiTokens();
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error.message || 'API-Token konnte nicht gelöscht werden',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setTokenToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  // Filtere und flattene die Daten für die Tabelle
  const filteredRows = [];
  Object.entries(apiTokensByUser).forEach(([userId, tokens]) => {
    if (!tokens || tokens.length === 0) return;
    
    const userName = tokens[0]?.linkedUser?.name || tokens[0]?.createdBy || 'Unbekannt';
    
    // Filter anwenden
    if (searchValue && !userName.toLowerCase().includes(searchValue.toLowerCase()) &&
        !tokens.some(t => t.description?.toLowerCase().includes(searchValue.toLowerCase()))) {
      return;
    }

    tokens.forEach((apiToken) => {
      filteredRows.push({
        userId,
        userName,
        token: apiToken,
      });
    });
  });

  const rows = filteredRows.map((row, idx) => (
    <Table.Tr key={`${row.userId}-${row.token.id}-${idx}`}>
      <Table.Td>
        <Group gap="xs">
          <IconUser size={14} />
          <Text size="sm">{row.userName}</Text>
        </Group>
      </Table.Td>
      <Table.Td>{row.token.description}</Table.Td>
      <Table.Td>
        {isExpired(row.token.validUntil) ? (
          <Badge color="red">Abgelaufen ({formatDate(row.token.validUntil)})</Badge>
        ) : (
          <Badge color="green">Gültig bis {formatDate(row.token.validUntil)}</Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Badge>{row.token.rights?.length || 0} Rechte</Badge>
      </Table.Td>
      <Table.Td>{formatDate(row.token.createdAt)}</Table.Td>
      <Table.Td>{row.token.createdBy || '-'}</Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => {
                setTokenToDelete(row);
                setDeleteModalOpen(true);
              }}
            >
              Löschen
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Card withBorder padding="lg" radius="md" mb="md">
        <Stack gap="xs">
          <Group>
            <IconUser size={20} />
            <Text fw={500}>API-Token Administration</Text>
          </Group>
          <Text size="sm" c="dimmed">
            Verwaltung aller API-Tokens aller Benutzer im System
          </Text>
        </Stack>
      </Card>

      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Suche nach Benutzer oder Beschreibung"
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          style={{ width: 300 }}
        />
        <Button onClick={loadApiTokens} variant="light">
          Aktualisieren
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ textAlign: 'left' }}>Benutzer</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Beschreibung</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Gültigkeit</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Rechte</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Erstellt am</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Erstellt von</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Aktionen</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                <Text>Lade...</Text>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                <Text>Keine API-Tokens gefunden</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Lösch-Bestätigung */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="API-Token löschen"
      >
        <Text mb="md">
          Möchten Sie den API-Token "{tokenToDelete?.token?.description}" von Benutzer "{tokenToDelete?.userName}" wirklich löschen?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Abbrechen
          </Button>
          <Button color="red" onClick={handleDelete}>
            Löschen
          </Button>
        </Group>
      </Modal>
    </>
  );
}
