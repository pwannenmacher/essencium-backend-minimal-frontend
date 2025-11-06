import { useEffect, useContext, useState } from 'react';
import { Modal, TextInput, Button, Group, Checkbox, ScrollArea, Stack, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AuthContext } from '../context/AuthContext';
import { createApiToken, updateApiToken } from '../services/apiTokenService';

// Verfügbare Rechte für API-Tokens
const AVAILABLE_RIGHTS = [
  'USER_CREATE',
  'USER_READ',
  'USER_UPDATE',
  'USER_DELETE',
  'ROLE_CREATE',
  'ROLE_READ',
  'ROLE_UPDATE',
  'ROLE_DELETE',
  'RIGHT_READ',
];

export default function ApiTokenFormModal({ opened, onClose, apiToken }) {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const isEdit = !!apiToken;

  const form = useForm({
    initialValues: {
      description: '',
      validUntil: null,
      rights: [],
    },
    validate: {
      description: (value) => (!value ? 'Beschreibung ist erforderlich' : null),
      validUntil: (value) => {
        if (!value) return 'Gültigkeitsdatum ist erforderlich';
        if (new Date(value) < new Date()) return 'Datum muss in der Zukunft liegen';
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      // Reset loading state when modal opens
      setLoading(false);
      
      if (apiToken) {
        form.setValues({
          description: apiToken.description || '',
          validUntil: apiToken.validUntil ? new Date(apiToken.validUntil) : null,
          rights: apiToken.rights?.map(r => r.authority || r) || [],
        });
      } else {
        form.reset();
      }
    }
  }, [apiToken, opened]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Formatiere das Datum als ISO-String (nur Datum, keine Zeit)
      const formattedData = {
        ...values,
        validUntil: values.validUntil ? values.validUntil.toISOString().split('T')[0] : null,
      };

      let result;
      if (isEdit) {
        result = await updateApiToken(token, apiToken.id, formattedData);
        notifications.show({
          title: 'Erfolg',
          message: 'API-Token wurde aktualisiert',
          color: 'green',
        });
      } else {
        result = await createApiToken(token, formattedData);
        notifications.show({
          title: 'Erfolg',
          message: 'API-Token wurde erstellt',
          color: 'green',
        });
      }
      
      // Reset loading state and form before closing
      setLoading(false);
      form.reset();
      
      // Übergebe den erstellten Token (mit JWT) an den Parent
      onClose(result);
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error.message || 'API-Token konnte nicht gespeichert werden',
        color: 'red',
      });
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
    form.setFieldValue('rights', [...AVAILABLE_RIGHTS]);
  };

  const deselectAllRights = () => {
    form.setFieldValue('rights', []);
  };

  const handleClose = () => {
    setLoading(false);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'API-Token bearbeiten' : 'Neuer API-Token'}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Beschreibung"
            placeholder="z.B. CI/CD Pipeline Token"
            required
            {...form.getInputProps('description')}
          />

          <DateInput
            label="Gültig bis"
            placeholder="Datum auswählen"
            required
            minDate={new Date()}
            valueFormat="DD.MM.YYYY"
            {...form.getInputProps('validUntil')}
          />

          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Rechte ({form.values.rights.length} ausgewählt)
              </Text>
              <Group gap="xs">
                <Button size="xs" variant="light" onClick={selectAllRights}>
                  Alle auswählen
                </Button>
                <Button size="xs" variant="light" onClick={deselectAllRights}>
                  Alle abwählen
                </Button>
              </Group>
            </Group>

            <ScrollArea h={250} style={{ border: '1px solid #dee2e6', borderRadius: 4, padding: 8 }}>
              <Stack gap="xs">
                {AVAILABLE_RIGHTS.map((right) => (
                  <Checkbox
                    key={right}
                    label={right}
                    checked={form.values.rights.includes(right)}
                    onChange={() => toggleRight(right)}
                  />
                ))}
              </Stack>
            </ScrollArea>
          </div>

          {!isEdit && (
            <Text size="sm" c="dimmed">
              Hinweis: Der generierte Token wird nur einmal angezeigt. Speichern Sie ihn an einem sicheren Ort!
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
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
