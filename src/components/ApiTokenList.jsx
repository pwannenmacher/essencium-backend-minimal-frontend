import { useState } from 'react';
import {
  Table,
  Button,
  TextInput,
  Group,
  Menu,
  ActionIcon,
  Text,
  Modal,
  Badge,
  Code,
  Box,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconDots,
  IconTrash,
  IconCopy,
  IconAlertCircle,
  IconBan,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useListLoader } from '../hooks/useListLoader';
import { RIGHTS, API_TOKEN_STATUS } from '../constants';
import { formatDate } from '../utils/format';
import { getApiTokens, deleteApiToken, revokeApiToken } from '../services/apiTokenService';
import ApiTokenFormModal from './ApiTokenFormModal';
import ApiTokenStatusBadge from './ApiTokenStatusBadge';
import ConfirmActionModal from './ConfirmActionModal';
import { renderTableBody } from './TableBodyState';

const fetchApiTokens = (token) => getApiTokens(token, { size: 100 }).then((r) => r.content || []);

export default function ApiTokenList({ active }) {
  const { token, hasPermission } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [tokenToRevoke, setTokenToRevoke] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newTokenData, setNewTokenData] = useState(null);

  const hasApiTokenAdminRight = hasPermission(RIGHTS.API_TOKEN_ADMIN);

  const {
    data: apiTokens,
    loading,
    reload: loadApiTokens,
  } = useListLoader({
    active,
    fetcher: fetchApiTokens,
    errorMessage: 'API-Tokens konnten nicht geladen werden',
    initialData: [],
  });

  const handleDelete = async () => {
    try {
      await deleteApiToken(token, tokenToDelete.id);
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
      await revokeApiToken(token, tokenToRevoke.id);
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

  const handleCreate = () => {
    setFormModalOpen(true);
  };

  const handleFormClose = (createdToken) => {
    setFormModalOpen(false);
    loadApiTokens();

    if (createdToken?.token) {
      setNewTokenData(createdToken);
      setShowTokenModal(true);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notifications.show({
        title: 'Kopiert',
        message: 'Token wurde in die Zwischenablage kopiert',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Fehler',
        message: 'Token konnte nicht kopiert werden – bitte manuell kopieren',
        color: 'red',
      });
    }
  };

  const filteredTokens = apiTokens.filter((t) =>
    t.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const rows = filteredTokens.map((apiToken) => (
    <Table.Tr key={apiToken.id}>
      <Table.Td>{apiToken.description}</Table.Td>
      <Table.Td>
        <ApiTokenStatusBadge apiToken={apiToken} />
      </Table.Td>
      <Table.Td>
        <Badge>{apiToken.rights?.length || 0} Rechte</Badge>
      </Table.Td>
      <Table.Td>{formatDate(apiToken.createdAt)}</Table.Td>
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
                setTokenToRevoke(apiToken);
                setRevokeModalOpen(true);
              }}
              disabled={apiToken.status !== API_TOKEN_STATUS.ACTIVE}
            >
              Widerrufen
            </Menu.Item>
            {hasApiTokenAdminRight && (
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={() => {
                  setTokenToDelete(apiToken);
                  setDeleteModalOpen(true);
                }}
              >
                Löschen
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Suche nach Beschreibung"
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          style={{ width: 300 }}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
          Neuer API-Token
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
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
            colSpan: 5,
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
        <Text>Möchten Sie den API-Token "{tokenToDelete?.description}" wirklich löschen?</Text>
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
          Möchten Sie den API-Token "{tokenToRevoke?.description}" wirklich widerrufen? Diese Aktion
          kann nicht rückgängig gemacht werden.
        </Text>
      </ConfirmActionModal>

      {/* Neuer Token anzeigen */}
      <Modal
        opened={showTokenModal}
        onClose={() => {
          setShowTokenModal(false);
          setNewTokenData(null);
        }}
        title="API-Token erstellt"
        size="lg"
      >
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" mb="md">
          Wichtig: Dieser Token wird nur einmal angezeigt. Speichern Sie ihn an einem sicheren Ort!
        </Alert>

        <Text size="sm" fw={500} mb="xs">
          Beschreibung: {newTokenData?.description}
        </Text>

        <Text size="sm" mb="xs">
          Token:
        </Text>

        <Box mb="md">
          <Code block style={{ wordBreak: 'break-all', fontSize: '11px' }}>
            {newTokenData?.token}
          </Code>
        </Box>

        <Group justify="space-between">
          <Button
            leftSection={<IconCopy size={16} />}
            variant="light"
            onClick={() => copyToClipboard(newTokenData?.token)}
          >
            In Zwischenablage kopieren
          </Button>
          <Button
            onClick={() => {
              setShowTokenModal(false);
              setNewTokenData(null);
            }}
          >
            Schließen
          </Button>
        </Group>
      </Modal>

      <ApiTokenFormModal opened={formModalOpen} onClose={handleFormClose} />
    </>
  );
}

ApiTokenList.propTypes = {
  active: PropTypes.bool,
};
