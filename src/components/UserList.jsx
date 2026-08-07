import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Text,
  Stack,
  Title,
  Badge,
  Group,
  Loader,
  Alert,
  Pagination,
  TextInput,
  Button,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconSearch,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconUserOff,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useAuthTokenRef } from '../hooks/useAuthTokenRef';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  terminateUserSessions,
} from '../services/userService';
import { getRoles } from '../services/roleService';
import UserFormModal from './UserFormModal';
import ConfirmActionModal from './ConfirmActionModal';
import { renderTableBody } from './TableBodyState';

export default function UserList({ active }) {
  const { token, isAuthenticated } = useAuth();
  const tokenRef = useAuthTokenRef();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(
    async (pageNum, filters = {}) => {
      if (!tokenRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const params = {
          page: pageNum,
          size: 10,
          sort: 'email,asc',
        };

        if (filters.email) params.email = filters.email;
        if (filters.name) params.name = filters.name;

        const data = await getUsers(tokenRef.current, params);

        setUsers(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
        setPage(pageNum);
      } catch (err) {
        console.error('Fehler beim Laden der User:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [tokenRef]
  );

  const fetchRoles = useCallback(async () => {
    try {
      const data = await getRoles(tokenRef.current, { size: 100 });
      setRoles(data.content || []);
    } catch (err) {
      console.error('Fehler beim Laden der Rollen:', err);
    }
  }, [tokenRef]);

  useEffect(() => {
    if (active && isAuthenticated) {
      fetchUsers(0, { email: searchEmail, name: searchName });
      fetchRoles();
    }
    // Suchbegriffe bewusst nicht in den Deps: Die Suche wird nur explizit
    // über Button/Enter ausgelöst, nicht bei jedem Tastendruck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isAuthenticated, fetchUsers, fetchRoles]);

  const currentFilters = () => ({ email: searchEmail, name: searchName });

  const handleSearch = () => {
    fetchUsers(0, currentFilters());
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage - 1, currentFilters()); // Mantine Pagination ist 1-basiert
  };

  const handleCreateUser = () => {
    setModalMode('create');
    setSelectedUser(null);
    setModalOpened(true);
  };

  const handleEditUser = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setModalOpened(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(token, userToDelete.id);
      notifications.show({
        title: 'Erfolg',
        message: `Benutzer ${userToDelete.email} wurde gelöscht`,
        color: 'green',
      });
      setDeleteModalOpened(false);
      setUserToDelete(null);
      fetchUsers(page, currentFilters());
    } catch (err) {
      notifications.show({
        title: 'Fehler',
        message: err.message,
        color: 'red',
      });
    }
  };

  const handleTerminateSessions = async (user) => {
    try {
      await terminateUserSessions(token, user.id);
      notifications.show({
        title: 'Erfolg',
        message: `Sessions von ${user.email} wurden beendet`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Fehler',
        message: err.message,
        color: 'red',
      });
    }
  };

  const handleFormSubmit = async (userData) => {
    if (modalMode === 'create') {
      await createUser(token, userData);
      notifications.show({
        title: 'Erfolg',
        message: 'Benutzer wurde erstellt',
        color: 'green',
      });
    } else {
      await updateUser(token, selectedUser.id, userData);
      notifications.show({
        title: 'Erfolg',
        message: 'Benutzer wurde aktualisiert',
        color: 'green',
      });
    }
    fetchUsers(page, currentFilters());
    setModalOpened(false);
  };

  if (loading && users.length === 0) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group justify="center">
          <Loader size="sm" />
          <Text>Lade Benutzer...</Text>
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
            <Title order={4}>Alle Benutzer</Title>
            <Group gap="xs">
              <Badge>{totalElements} Benutzer</Badge>
              <ActionIcon onClick={() => fetchUsers(page, currentFilters())} loading={loading}>
                <IconRefresh size={16} />
              </ActionIcon>
              <Button leftSection={<IconPlus size={16} />} onClick={handleCreateUser}>
                Neuer Benutzer
              </Button>
            </Group>
          </Group>

          {/* Such-Filter */}
          <Group gap="sm">
            <TextInput
              placeholder="E-Mail suchen..."
              leftSection={<IconSearch size={14} />}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <TextInput
              placeholder="Name suchen..."
              leftSection={<IconSearch size={14} />}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <Button onClick={handleSearch} loading={loading}>
              Suchen
            </Button>
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ textAlign: 'left' }}>ID</Table.Th>
                <Table.Th style={{ textAlign: 'left' }}>Name</Table.Th>
                <Table.Th style={{ textAlign: 'left' }}>E-Mail</Table.Th>
                <Table.Th style={{ textAlign: 'left' }}>Rollen</Table.Th>
                <Table.Th style={{ textAlign: 'left' }}>Status</Table.Th>
                <Table.Th style={{ textAlign: 'left' }}>Aktionen</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {renderTableBody({
                loading,
                colSpan: 6,
                emptyMessage: 'Keine Benutzer gefunden',
                rows: users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text
                        size="sm"
                        c="dimmed"
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.85em',
                        }}
                      >
                        {user.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {user.firstName} {user.lastName}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {user.roles?.slice(0, 3).map((role) => (
                          <Badge key={role.name} size="sm" variant="light">
                            {role.name}
                          </Badge>
                        ))}
                        {user.roles?.length > 3 && (
                          <Badge size="sm" variant="light" color="gray">
                            +{user.roles.length - 3}
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {user.enabled ? (
                        <Badge color="green" size="sm">
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge color="red" size="sm">
                          Inaktiv
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon size="sm" variant="subtle">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handleEditUser(user)}
                          >
                            Bearbeiten
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconUserOff size={14} />}
                            onClick={() => handleTerminateSessions(user)}
                          >
                            Sessions beenden
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDeleteClick(user)}
                          >
                            Löschen
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                )),
              })}
            </Table.Tbody>
          </Table>

          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination value={page + 1} onChange={handlePageChange} total={totalPages} />
            </Group>
          )}
        </Stack>
      </Card>

      <UserFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        roles={roles}
        mode={modalMode}
      />

      <ConfirmActionModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleDeleteConfirm}
        title="Benutzer löschen"
        confirmLabel="Löschen"
        centered
      >
        <Text>
          Möchten Sie den Benutzer <strong>{userToDelete?.email}</strong> wirklich löschen? Diese
          Aktion kann nicht rückgängig gemacht werden.
        </Text>
      </ConfirmActionModal>
    </>
  );
}

UserList.propTypes = {
  active: PropTypes.bool,
};
