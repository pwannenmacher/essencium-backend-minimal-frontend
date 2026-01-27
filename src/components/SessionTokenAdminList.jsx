import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Table,
  TextInput,
  Group,
  Menu,
  ActionIcon,
  Text,
  Modal,
  Badge,
  Card,
  Stack,
  Button,
} from '@mantine/core';
import { IconSearch, IconDots, IconTrash, IconUser, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { getAllUsersWithTokens, deleteUserToken } from '../services/userService';

export default function SessionTokenAdminList({ active }) {
  const { token } = useContext(AuthContext);
  const [sessionTokensByUser, setSessionTokensByUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);

  const loadSessionTokens = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllUsersWithTokens(token);
      console.log('Session Tokens Response:', response); // Debug log
      setSessionTokensByUser(response || {});
    } catch (error) {
      console.error('Session Tokens Error:', error); // Debug log
      notifications.show({
        title: 'Fehler',
        message: 'Session-Tokens konnten nicht geladen werden',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (active && token) {
      loadSessionTokens();
    }
  }, [active, token, loadSessionTokens]);

  const handleDelete = async () => {
    try {
      await deleteUserToken(token, tokenToDelete.userId, tokenToDelete.token.id);
      notifications.show({
        title: 'Erfolg',
        message: 'Session-Token wurde gelöscht',
        color: 'green',
      });
      loadSessionTokens();
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error.message || 'Session-Token konnte nicht gelöscht werden',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setTokenToDelete(null);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isExpired = (expirationString) => {
    if (!expirationString) return false;
    return new Date(expirationString) < new Date();
  };

  const getTokenTypeBadge = (tokenType) => {
    switch (tokenType) {
      case 'REFRESH':
        return <Badge color="blue">Refresh</Badge>;
      case 'ACCESS':
        return <Badge color="green">Access</Badge>;
      case 'API':
        return <Badge color="purple">API</Badge>;
      default:
        return <Badge color="gray">{tokenType || 'Unbekannt'}</Badge>;
    }
  };

  const filteredRows = [];

  if (sessionTokensByUser && typeof sessionTokensByUser === 'object') {
    Object.entries(sessionTokensByUser).forEach(([userId, tokens]) => {
      if (!tokens || tokens.length === 0) return;

      const userName = tokens[0]?.username || 'Unbekannt';

      if (searchValue && !userName.toLowerCase().includes(searchValue.toLowerCase())) {
        return;
      }

      tokens.forEach((sessionToken) => {
        filteredRows.push({
          userId,
          userName,
          token: sessionToken,
        });
      });
    });
  }

  const rows = filteredRows.map((row, idx) => (
    <Table.Tr key={`${row.userId}-${row.token.id}-${idx}`}>
      <Table.Td>
        <Group gap="xs">
          <IconUser size={14} />
          <Text size="sm">{row.userName}</Text>
        </Group>
      </Table.Td>
      <Table.Td>{getTokenTypeBadge(row.token.type)}</Table.Td>
      <Table.Td>{row.token.userAgent || '-'}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconClock size={14} />
          <Text size="sm">{formatDateTime(row.token.issuedAt)}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {isExpired(row.token.expiration) ? (
            <Badge color="red">Abgelaufen</Badge>
          ) : (
            <Badge color="green">Aktiv</Badge>
          )}
          <Text size="sm">{formatDateTime(row.token.expiration)}</Text>
        </Group>
      </Table.Td>
      <Table.Td>{row.token.lastUsed ? formatDateTime(row.token.lastUsed) : '-'}</Table.Td>
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
            <Text fw={500}>Session-Token Administration</Text>
          </Group>
          <Text size="sm" c="dimmed">
            Verwaltung aller Session-Tokens aller Benutzer im System
          </Text>
        </Stack>
      </Card>

      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Suche nach Benutzer"
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          style={{ width: 300 }}
        />
        <Button onClick={loadSessionTokens} variant="light">
          Aktualisieren
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ textAlign: 'left' }}>Benutzer</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Typ</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>User-Agent</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Erstellt</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Ablauf</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Zuletzt verwendet</Table.Th>
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
                <Text>Keine Session-Tokens gefunden</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Lösch-Bestätigung */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Session-Token löschen"
      >
        <Text mb="md">
          Möchten Sie den {tokenToDelete?.token?.type}-Token von Benutzer "{tokenToDelete?.userName}
          " wirklich löschen? Der Benutzer wird dadurch ausgeloggt.
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

SessionTokenAdminList.propTypes = {
  active: PropTypes.bool,
};
