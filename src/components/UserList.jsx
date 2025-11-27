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
  Modal,
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
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, terminateUserSessions } from '../services/userService';
import { getRoles } from '../services/roleService';
import UserFormModal from './UserFormModal';

export default function UserList({ active }) {
  const { token } = useAuth();
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

  const fetchUsers = useCallback(async (pageNum = page) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pageNum,
        size: 10,
        sort: 'email,asc',
      };

      if (searchEmail) params.email = searchEmail;
      if (searchName) params.name = searchName;

      const data = await getUsers(token, params);
      
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
  }, [token, page, searchEmail, searchName]);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await getRoles(token, { size: 100 });
      setRoles(data.content || []);
    } catch (err) {
      console.error('Fehler beim Laden der Rollen:', err);
    }
  }, [token]);

  // Lade Daten nur wenn Tab aktiv ist
  useEffect(() => {
    if (active && token) {
      fetchUsers(0);
      fetchRoles();
    }
  }, [active, token, fetchUsers, fetchRoles]);

  const handleSearch = () => {
    fetchUsers(0);
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage - 1); // Mantine Pagination ist 1-basiert
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
      fetchUsers(page);
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
    fetchUsers(page);
    setModalOpened(false);
  };

  if (loading && users.length === 0) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group position="center">
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
        <Stack spacing="md">
          <Group position="apart">
            <Title order={4}>Alle Benutzer</Title>
            <Group spacing="xs">
              <Badge>{totalElements} Benutzer</Badge>
              <ActionIcon onClick={() => fetchUsers(page)} loading={loading}>
                <IconRefresh size={16} />
              </ActionIcon>
              <Button leftSection={<IconPlus size={16} />} onClick={handleCreateUser}>
                Neuer Benutzer
              </Button>
            </Group>
          </Group>

        {/* Such-Filter */}
        <Group spacing="sm">
          <TextInput
            placeholder="E-Mail suchen..."
            icon={<IconSearch size={14} />}
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Name suchen..."
            icon={<IconSearch size={14} />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <Button onClick={handleSearch} loading={loading}>
            Suchen
          </Button>
        </Group>

        {users.length > 0 ? (
          <>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>ID</th>
                  <th style={{ textAlign: 'left' }}>Name</th>
                  <th style={{ textAlign: 'left' }}>E-Mail</th>
                  <th style={{ textAlign: 'left' }}>Rollen</th>
                  <th style={{ textAlign: 'left' }}>Status</th>
                  <th style={{ textAlign: 'left' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                        {user.id}
                      </Text>
                    </td>
                    <td>
                      <Text size="sm" weight={500}>
                        {user.firstName} {user.lastName}
                      </Text>
                    </td>
                    <td>
                      <Text size="sm">{user.email}</Text>
                    </td>
                    <td>
                      <Group spacing={4}>
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
                    </td>
                    <td>
                      {user.enabled ? (
                        <Badge color="green" size="sm">Aktiv</Badge>
                      ) : (
                        <Badge color="red" size="sm">Inaktiv</Badge>
                      )}
                    </td>
                    <td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon size="sm" variant="subtle">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item
                            icon={<IconEdit size={14} />}
                            onClick={() => handleEditUser(user)}
                          >
                            Bearbeiten
                          </Menu.Item>
                          <Menu.Item
                            icon={<IconUserOff size={14} />}
                            onClick={() => handleTerminateSessions(user)}
                          >
                            Sessions beenden
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            icon={<IconTrash size={14} />}
                            onClick={() => handleDeleteClick(user)}
                          >
                            Löschen
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <Group position="center" mt="md">
                <Pagination
                  page={page + 1}
                  onChange={handlePageChange}
                  total={totalPages}
                />
              </Group>
            )}
          </>
        ) : (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            Keine Benutzer gefunden
          </Text>
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

    <Modal
      opened={deleteModalOpened}
      onClose={() => setDeleteModalOpened(false)}
      title="Benutzer löschen"
      centered
    >
      <Stack spacing="md">
        <Text>
          Möchten Sie den Benutzer <strong>{userToDelete?.email}</strong> wirklich löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </Text>
        <Group position="right">
          <Button variant="subtle" onClick={() => setDeleteModalOpened(false)}>
            Abbrechen
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Löschen
          </Button>
        </Group>
      </Stack>
    </Modal>
    </>
  );
}
