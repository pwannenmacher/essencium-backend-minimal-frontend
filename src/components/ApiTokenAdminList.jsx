import { useState } from 'react';
import {
  Table,
  TextInput,
  Group,
  Menu,
  ActionIcon,
  Text,
  Badge,
  Card,
  Stack,
  Button,
} from '@mantine/core';
import { IconSearch, IconDots, IconTrash, IconUser, IconBan } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useListLoader } from '../hooks/useListLoader';
import { API_TOKEN_STATUS } from '../constants';
import { formatDate } from '../utils/format';
import { getAllApiTokensAdmin, deleteApiToken, revokeApiToken } from '../services/apiTokenService';
import ApiTokenStatusBadge from './ApiTokenStatusBadge';
import ConfirmActionModal from './ConfirmActionModal';
import { renderTableBody } from './TableBodyState';

const fetchAllApiTokens = (token) => getAllApiTokensAdmin(token).then((r) => r || {});

export default function ApiTokenAdminList({ active }) {
  const { token } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [tokenToRevoke, setTokenToRevoke] = useState(null);

  const {
    data: apiTokensByUser,
    loading,
    reload: loadApiTokens,
  } = useListLoader({
    active,
    fetcher: fetchAllApiTokens,
    errorMessage: 'API-Tokens konnten nicht geladen werden',
    initialData: {},
  });

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

  const filteredRows = [];
  Object.entries(apiTokensByUser).forEach(([userId, tokens]) => {
    if (!tokens || tokens.length === 0) return;

    const userName = tokens[0]?.linkedUser?.name || tokens[0]?.createdBy || 'Unbekannt';

    if (
      searchValue &&
      !userName.toLowerCase().includes(searchValue.toLowerCase()) &&
      !tokens.some((t) => t.description?.toLowerCase().includes(searchValue.toLowerCase()))
    ) {
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
          <Text size="sm">
            {row.userName} ({row.token.createdBy || 'Unbekannt'})
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>{row.token.description}</Table.Td>
      <Table.Td>
        <ApiTokenStatusBadge apiToken={row.token} />
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
              disabled={row.token.status !== API_TOKEN_STATUS.ACTIVE}
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
          {renderTableBody({
            loading,
            rows,
            colSpan: 6,
            emptyMessage: 'Keine API-Tokens gefunden',
          })}
        </Table.Tbody>
      </Table>

      <ConfirmActionModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="API-Token löschen"
        confirmLabel="Löschen"
      >
        <Text>
          Möchten Sie den API-Token "{tokenToDelete?.token?.description}" von Benutzer "
          {tokenToDelete?.userName}" wirklich löschen?
        </Text>
      </ConfirmActionModal>

      <ConfirmActionModal
        opened={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        onConfirm={handleRevoke}
        title="API-Token widerrufen"
        confirmLabel="Widerrufen"
        confirmColor="orange"
      >
        <Text>
          Möchten Sie den API-Token "{tokenToRevoke?.token?.description}" von Benutzer "
          {tokenToRevoke?.userName}" wirklich widerrufen? Diese Aktion kann nicht rückgängig gemacht
          werden.
        </Text>
      </ConfirmActionModal>
    </>
  );
}

ApiTokenAdminList.propTypes = {
  active: PropTypes.bool,
};
