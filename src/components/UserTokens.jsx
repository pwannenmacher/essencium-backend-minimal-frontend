import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Text,
  Stack,
  Title,
  Badge,
  Group,
  Loader,
  Alert,
  Button,
  ActionIcon,
  Tooltip,
  Modal,
} from '@mantine/core';
import { IconClock, IconAlertCircle, IconTrash, IconCircleCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { getMyTokens, deleteMyToken } from '../services/userService';
import { parseJwt } from '../utils/jwt';

const TOKEN_TYPE_COLORS = {
  REFRESH: 'blue',
  ACCESS: 'green',
};

export default function UserTokens() {
  const { token } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentParentTokenId, setCurrentParentTokenId] = useState(null);

  useEffect(() => {
    if (token) {
      const payload = parseJwt(token);
      if (payload?.parent_token_id) {
        setCurrentParentTokenId(payload.parent_token_id);
      }
    }
  }, [token]);

  const fetchTokens = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const tokensData = await getMyTokens(token);
      setTokens(Array.isArray(tokensData) ? tokensData : []);
    } catch (err) {
      console.error('Fehler beim Laden der Tokens:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTokens();
  }, [token, fetchTokens]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('de-DE');
  };

  const handleDeleteClick = (tokenItem) => {
    setTokenToDelete(tokenItem);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tokenToDelete) return;

    setDeleting(true);
    try {
      await deleteMyToken(token, tokenToDelete.id);
      notifications.show({
        title: 'Erfolg',
        message: 'Session wurde beendet',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setTokenToDelete(null);
      fetchTokens(); // Neu laden
    } catch (err) {
      notifications.show({
        title: 'Fehler',
        message: err.message,
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group justify="center">
          <Loader size="sm" />
          <Text>Lade Token-Informationen...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fehler">
          {error}
        </Alert>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder padding="lg" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>Aktive Sessions</Title>
            <Badge>{tokens.length}</Badge>
          </Group>

          {tokens.length > 0 ? (
            <Stack gap="sm">
              {tokens.map((tokenItem) => {
                const isCurrentSession =
                  tokenItem.type === 'REFRESH' && tokenItem.id === currentParentTokenId;
                return (
                  <Card
                    key={tokenItem.id}
                    withBorder
                    padding="sm"
                    radius="sm"
                    style={
                      isCurrentSession
                        ? {
                            borderColor: 'var(--mantine-color-blue-6)',
                            borderWidth: '2px',
                          }
                        : {}
                    }
                  >
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Badge color={TOKEN_TYPE_COLORS[tokenItem.type] ?? 'gray'}>
                            {tokenItem.type}
                          </Badge>
                          {isCurrentSession && (
                            <Badge color="green" leftSection={<IconCircleCheck size={12} />}>
                              Aktuelle Session
                            </Badge>
                          )}
                        </Group>

                        {tokenItem.userAgent && (
                          <Text size="xs" c="dimmed" style={{ wordBreak: 'break-word' }}>
                            <strong>User-Agent:</strong> {tokenItem.userAgent}
                          </Text>
                        )}

                        <Stack gap={4}>
                          {tokenItem.issuedAt && (
                            <Group gap="xs">
                              <IconClock size={14} />
                              <Text size="xs">Erstellt: {formatDate(tokenItem.issuedAt)}</Text>
                            </Group>
                          )}

                          {tokenItem.expiration && (
                            <Group gap="xs">
                              <IconClock size={14} />
                              <Text size="xs">Läuft ab: {formatDate(tokenItem.expiration)}</Text>
                            </Group>
                          )}

                          {tokenItem.lastUsed && (
                            <Group gap="xs">
                              <IconClock size={14} />
                              <Text size="xs">
                                Zuletzt benutzt: {formatDate(tokenItem.lastUsed)}
                              </Text>
                            </Group>
                          )}
                        </Stack>
                      </Stack>

                      <Tooltip label="Session beenden">
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleDeleteClick(tokenItem)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              Keine aktiven Sessions gefunden
            </Text>
          )}
        </Stack>
      </Card>

      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Session beenden"
        centered
      >
        <Stack gap="md">
          <Text>Möchten Sie diese Session wirklich beenden?</Text>
          {tokenToDelete && (
            <Card withBorder padding="sm" bg="var(--mantine-color-body)">
              <Stack gap={4}>
                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Typ:
                  </Text>
                  <Badge size="sm" color={tokenToDelete.type === 'REFRESH' ? 'blue' : 'green'}>
                    {tokenToDelete.type}
                  </Badge>
                </Group>
                {tokenToDelete.userAgent && (
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      Gerät:
                    </Text>
                    <Text size="sm" c="dimmed">
                      {tokenToDelete.userAgent}
                    </Text>
                  </Group>
                )}
                {tokenToDelete.issuedAt && (
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      Erstellt:
                    </Text>
                    <Text size="sm">{formatDate(tokenToDelete.issuedAt)}</Text>
                  </Group>
                )}
              </Stack>
            </Card>
          )}
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => setDeleteModalOpened(false)}
              disabled={deleting}
            >
              Abbrechen
            </Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={deleting}>
              Session beenden
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
