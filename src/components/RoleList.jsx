import { useState } from 'react';
import { Table, Button, TextInput, Group, Menu, ActionIcon, Text, Badge } from '@mantine/core';
import { IconSearch, IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useListLoader } from '../hooks/useListLoader';
import { RIGHTS } from '../constants';
import { getRoles, deleteRole } from '../services/roleService';
import RoleFormModal from './RoleFormModal';
import ConfirmActionModal from './ConfirmActionModal';
import { renderTableBody } from './TableBodyState';

const fetchRoles = (token) => getRoles(token, { size: 100 }).then((r) => r.content || []);

export default function RoleList({ active }) {
  const { token, hasPermission } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);

  const hasRoleCreateRight = hasPermission(RIGHTS.ROLE_CREATE);
  const hasRoleUpdateRight = hasPermission(RIGHTS.ROLE_UPDATE);
  const hasRoleDeleteRight = hasPermission(RIGHTS.ROLE_DELETE);

  const {
    data: roles,
    loading,
    reload: loadRoles,
  } = useListLoader({
    active,
    fetcher: fetchRoles,
    errorMessage: 'Rollen konnten nicht geladen werden',
    initialData: [],
  });

  const handleDelete = async () => {
    try {
      await deleteRole(token, roleToDelete.name);
      notifications.show({
        title: 'Erfolg',
        message: 'Rolle wurde gelöscht',
        color: 'green',
      });
      loadRoles();
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error.message || 'Rolle konnte nicht gelöscht werden',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleEdit = (role) => {
    setEditRole(role);
    setFormModalOpen(true);
  };

  const handleCreate = () => {
    setEditRole(null);
    setFormModalOpen(true);
  };

  const handleFormClose = () => {
    setFormModalOpen(false);
    setEditRole(null);
    loadRoles();
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const rows = filteredRoles.map((role) => (
    <Table.Tr key={role.name}>
      <Table.Td>{role.name}</Table.Td>
      <Table.Td>{role.description || '-'}</Table.Td>
      <Table.Td>
        {role.editable ? (
          <Badge color="blue">Editierbar</Badge>
        ) : (
          <Badge color="gray">Geschützt</Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Badge>{role.rights?.length || 0} Rechte</Badge>
      </Table.Td>
      <Table.Td>
        {(hasRoleUpdateRight || hasRoleDeleteRight) && (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {hasRoleUpdateRight && (
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => handleEdit(role)}
                  disabled={!role.editable}
                >
                  Bearbeiten
                </Menu.Item>
              )}
              {hasRoleDeleteRight && (
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() => {
                    setRoleToDelete(role);
                    setDeleteModalOpen(true);
                  }}
                  disabled={!role.editable}
                >
                  Löschen
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Suche nach Name oder Beschreibung"
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          style={{ width: 300 }}
        />
        {hasRoleCreateRight && (
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            Neue Rolle
          </Button>
        )}
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ textAlign: 'left' }}>Name</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Beschreibung</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Status</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Rechte</Table.Th>
            <Table.Th style={{ textAlign: 'left' }}>Aktionen</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {renderTableBody({ loading, rows, colSpan: 5, emptyMessage: 'Keine Rollen gefunden' })}
        </Table.Tbody>
      </Table>

      <ConfirmActionModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Rolle löschen"
        confirmLabel="Löschen"
      >
        <Text>Möchten Sie die Rolle "{roleToDelete?.name}" wirklich löschen?</Text>
      </ConfirmActionModal>

      <RoleFormModal opened={formModalOpen} onClose={handleFormClose} role={editRole} />
    </>
  );
}

RoleList.propTypes = {
  active: PropTypes.bool,
};
