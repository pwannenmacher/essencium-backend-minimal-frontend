import { useState, useEffect, useContext, useCallback } from 'react';
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
import { AuthContext } from '../context/AuthContext';
import { getApiTokens, deleteApiToken, revokeApiToken } from '../services/apiTokenService';
import ApiTokenFormModal from './ApiTokenFormModal';

export default function ApiTokenList({ active }) {
  const { token, user } = useContext(AuthContext);
  const [apiTokens, setApiTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [tokenToRevoke, setTokenToRevoke] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newTokenData, setNewTokenData] = useState(null);

  const hasApiTokenAdminRight = user?.roles?.some((role) =>
    role.rights?.some((right) => right.authority === 'API_TOKEN_ADMIN')
  );

  const loadApiTokens = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getApiTokens(token, { size: 100 });
      setApiTokens(response.content || []);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Kopiert',
      message: 'Token wurde in die Zwischenablage kopiert',
      color: 'green',
    });
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
        return (
          <Badge color="orange">
            Widerrufen (Rolle geändert, {formatDateTime(apiToken.updatedAt)})
          </Badge>
        );

      case 'REVOKED_RIGHTS_CHANGED':
        return (
          <Badge color="orange">
            Widerrufen (Rechte geändert, {formatDateTime(apiToken.updatedAt)})
          </Badge>
        );

      case 'REVOKED_USER_CHANGED':
        return (
          <Badge color="orange">
            Widerrufen (Nutzer geändert, {formatDateTime(apiToken.updatedAt)})
          </Badge>
        );

      case 'EXPIRED':
        return <Badge color="red">Abgelaufen</Badge>;

      case 'USER_DELETED':
        return <Badge color="red">Nutzer gelöscht</Badge>;

      default:
        return <Badge color="gray">{status || 'Unbekannt'}</Badge>;
    }
  };

  const filteredTokens = apiTokens.filter((t) =>
    t.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const rows = filteredTokens.map((apiToken) => (
    <Table.Tr key={apiToken.id}>
      <Table.Td>{apiToken.description}</Table.Td>
      <Table.Td>{getStatusBadge(apiToken)}</Table.Td>
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
              disabled={apiToken.status !== 'ACTIVE'}
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
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                <Text>Lade...</Text>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
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
          Möchten Sie den API-Token "{tokenToDelete?.description}" wirklich löschen?
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
          Möchten Sie den API-Token "{tokenToRevoke?.description}" wirklich widerrufen? Diese Aktion
          kann nicht rückgängig gemacht werden.
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
