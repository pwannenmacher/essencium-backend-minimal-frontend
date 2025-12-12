import { useEffect, useContext, useState, useCallback } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Checkbox, ScrollArea, Stack, Text, Alert, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { createRole, updateRole, getAllRights } from '../services/roleService';

export default function RoleFormModal({ opened, onClose, role }) {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [availableRights, setAvailableRights] = useState([]);
  const [loadingRights, setLoadingRights] = useState(false);
  const isEdit = !!role;

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      rights: [],
    },
    validate: {
      name: (value) => (!value ? 'Name ist erforderlich' : null),
      description: (value) => (!value ? 'Beschreibung ist erforderlich' : null),
    },
  });

  const loadRights = useCallback(async () => {
    setLoadingRights(true);
    try {
      const response = await getAllRights(token, { size: 1000 });
      const rights = response.content || [];
      const rightAuthorities = rights.map(right => right.authority);
      setAvailableRights(rightAuthorities);
    } catch {
      notifications.show({
        title: 'Fehler',
        message: 'Rechte konnten nicht geladen werden',
        color: 'red',
      });
      setAvailableRights([]);
    } finally {
      setLoadingRights(false);
    }
  }, [token]);

  useEffect(() => {
    if (opened) {
      loadRights();
    }
  }, [opened, loadRights]);

  useEffect(() => {
    if (role) {
      form.setValues({
        name: role.name || '',
        description: role.description || '',
        rights: role.rights || [],
      });
    } else {
      form.reset();
    }
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        await updateRole(token, role.name, values);
        notifications.show({
          title: 'Erfolg',
          message: 'Rolle wurde aktualisiert',
          color: 'green',
        });
      } else {
        await createRole(token, values);
        notifications.show({
          title: 'Erfolg',
          message: 'Rolle wurde erstellt',
          color: 'green',
        });
      }
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error.message || 'Rolle konnte nicht gespeichert werden',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRight = (right) => {
    const currentRights = form.values.rights;
    if (currentRights.includes(right)) {
      form.setFieldValue('rights', currentRights.filter(r => r !== right));
    } else {
      form.setFieldValue('rights', [...currentRights, right]);
    }
  };

  const selectAllRights = () => {
    form.setFieldValue('rights', [...availableRights]);
  };

  const deselectAllRights = () => {
    form.setFieldValue('rights', []);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Rolle bearbeiten' : 'Neue Rolle'}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="z.B. EDITOR"
            required
            disabled={isEdit}
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Beschreibung"
            placeholder="Beschreibung der Rolle"
            required
            minRows={3}
            {...form.getInputProps('description')}
          />

          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Rechte ({form.values.rights.length} ausgewählt)
              </Text>
              <Group gap="xs">
                <Button size="xs" variant="light" onClick={selectAllRights} disabled={loadingRights || availableRights.length === 0}>
                  Alle auswählen
                </Button>
                <Button size="xs" variant="light" onClick={deselectAllRights}>
                  Alle abwählen
                </Button>
              </Group>
            </Group>

            {loadingRights ? (
              <Group justify="center" p="xl">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Lade Rechte...</Text>
              </Group>
            ) : availableRights.length === 0 ? (
              <Alert icon={<IconAlertCircle size={16} />} color="yellow" mb="md">
                Keine Rechte verfügbar.
              </Alert>
            ) : (
              <ScrollArea h={250} style={{ border: '1px solid #dee2e6', borderRadius: 4, padding: 8 }}>
                <Stack gap="xs">
                  {availableRights.map((right) => (
                    <Checkbox
                      key={right}
                      label={right}
                      checked={form.values.rights.includes(right)}
                      onChange={() => toggleRight(right)}
                    />
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </div>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

RoleFormModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  role: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    rights: PropTypes.arrayOf(PropTypes.string)
  })
};
