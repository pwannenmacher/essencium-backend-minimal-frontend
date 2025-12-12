import { useState, useEffect, useContext, useCallback } from 'react';
import { Table, TextInput, Group, Menu, ActionIcon, Text, Modal, Badge, Card, Stack, Button } from '@mantine/core';
import { IconSearch, IconDots, IconTrash, IconUser, IconBan } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { getAllApiTokensAdmin, deleteApiToken, revokeApiToken } from '../services/apiTokenService';

export default function ApiTokenAdminList({ active }) {
  const { token } = useContext(AuthContext);
  const [apiTokensByUser, setApiTokensByUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [tokenToRevoke, setTokenToRevoke] = useState(null);

  const loadApiTokens = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllApiTokensAdmin(token);
      setApiTokensByUser(response || {});
    } catch {
      notifications.show({
        title: 'Fehler',
        message: 'API-Tokens konnten nicht geladen werden',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (active && token) {
      loadApiTokens();
    }
  }, [active, token, loadApiTokens]);

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

  const handleRevoke = async () => {
    try {
      await revokeApiToken(token, tokenToRevoke.token.id);
      notifications.show({
        title: 'Erfolg',
        message: 'API-Token wurde widerrufen',
        color: 'green',
      });
      loadApiTokens();
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error.message || 'API-Token konnte nicht widerrufen werden',
        color: 'red',
      });
    } finally {
      setRevokeModalOpen(false);
      setTokenToRevoke(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const getStatusBadge = (apiToken) => {
    const status = apiToken.status;
    
    if (!status) {
      if (isExpired(apiToken.validUntil)) {
        return <Badge color="red">Abgelaufen ({formatDate(apiToken.validUntil)})</Badge>;
      }
      return <Badge color="green">Aktiv bis {formatDate(apiToken.validUntil)}</Badge>;
    }
    
    switch (status) {
      case 'ACTIVE':
        if (isExpired(apiToken.validUntil)) {
          return <Badge color="red">Abgelaufen ({formatDate(apiToken.validUntil)})</Badge>;
        }
        return <Badge color="green">Aktiv bis {formatDate(apiToken.validUntil)}</Badge>;
      
      case 'REVOKED':
        return <Badge color="gray">Widerrufen ({formatDateTime(apiToken.updatedAt)})</Badge>;
      
      case 'REVOKED_ROLE_CHANGED':
        return <Badge color="orange">Widerrufen (Rolle geändert, {formatDateTime(apiToken.updatedAt)})</Badge>;
      
      case 'REVOKED_RIGHTS_CHANGED':
        return <Badge color="orange">Widerrufen (Rechte geändert, {formatDateTime(apiToken.updatedAt)})</Badge>;
      
      case 'REVOKED_USER_CHANGED':
        return <Badge color="orange">Widerrufen (Nutzer geändert, {formatDateTime(apiToken.updatedAt)})</Badge>;
      
      case 'EXPIRED':
        return <Badge color="red">Abgelaufen</Badge>;
      
      case 'USER_DELETED':
        return <Badge color="red">Nutzer gelöscht</Badge>;
      
      default:
        return <Badge color="gray">{status || 'Unbekannt'}</Badge>;
    }
  };

  const filteredRows = [];
  Object.entries(apiTokensByUser).forEach(([userId, tokens]) => {
    if (!tokens || tokens.length === 0) return;
    
    const userName = tokens[0]?.linkedUser?.name || tokens[0]?.createdBy || 'Unbekannt';
    
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
          <Text size="sm">{row.userName} ({row.token.createdBy || 'Unbekannt'})</Text>
        </Group>
      </Table.Td>
      <Table.Td>{row.token.description}</Table.Td>
      <Table.Td>
        {getStatusBadge(row.token)}
      </Table.Td>
      <Table.Td>
        <Badge>{row.token.rights?.length || 0} Rechte</Badge>
      </Table.Td>
      <Table.Td>{formatDate(row.token.createdAt)}</Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconBan size={14} />}
              color="orange"
              onClick={() => {
                setTokenToRevoke(row);
                setRevokeModalOpen(true);
              }}
              disabled={row.token.status !== 'ACTIVE'}
            >
              Widerrufen
            </Menu.Item>
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
            <Table.Th style={{ textAlign: 'left' }}>Benutzer (Benutzername)</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Beschreibung</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Gültigkeit</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Rechte</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Erstellt am</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Aktionen</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={6} style={{ textAlign: 'center' }}>
                <Text>Lade...</Text>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6} style={{ textAlign: 'center' }}>
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

      {/* Revoke-Bestätigung */}
      <Modal
        opened={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="API-Token widerrufen"
      >
        <Text mb="md">
          Möchten Sie den API-Token "{tokenToRevoke?.token?.description}" von Benutzer "{tokenToRevoke?.userName}" wirklich widerrufen? Diese Aktion kann nicht rückgängig gemacht werden.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRevokeModalOpen(false)}>
            Abbrechen
          </Button>
          <Button color="orange" onClick={handleRevoke}>
            Widerrufen
          </Button>
        </Group>
      </Modal>
    </>
  );
}

ApiTokenAdminList.propTypes = {
  active: PropTypes.bool
};
