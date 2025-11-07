import { useEffect, useContext, useState } from 'react';
import { Modal, TextInput, Button, Group, Checkbox, ScrollArea, Stack, Text, Alert } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { AuthContext } from '../context/AuthContext';
import { createApiToken } from '../services/apiTokenService';

export default function ApiTokenFormModal({ opened, onClose }) {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Verfügbare Rechte basierend auf den Rechten des aktuellen Users
  const availableRights = user?.roles?.flatMap(role => 
    role.rights?.map(right => right.authority) || []
  ) || [];
  
  // Entferne Duplikate
  const uniqueAvailableRights = [...new Set(availableRights)];

  const form = useForm({
    initialValues: {
      description: '',
      validUntil: null,
      rights: [],
    },
    validate: {
      description: (value) => (!value ? 'Beschreibung ist erforderlich' : null),
      validUntil: (value) => {
        if (value && new Date(value) < new Date()) {
          return 'Datum muss in der Zukunft liegen';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      // Reset form and loading state when modal opens
      setLoading(false);
      form.reset();
    }
  }, [opened]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Formatiere das Datum als ISO-String (nur Datum, keine Zeit)
      const formattedData = {
        ...values,
        validUntil: values.validUntil ? values.validUntil.toISOString().split('T')[0] : null,
      };

      const result = await createApiToken(token, formattedData);
      notifications.show({
        title: 'Erfolg',
        message: 'API-Token wurde erstellt',
        color: 'green',
      });
      
      // Reset loading state and form before closing
      setLoading(false);
      form.reset();
      
      // Übergebe den erstellten Token (mit JWT) an den Parent
      onClose(result);
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error.message || 'API-Token konnte nicht erstellt werden',
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
    form.setFieldValue('rights', [...uniqueAvailableRights]);
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
      title="Neuer API-Token"
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
            placeholder="Datum auswählen (optional)"
            description="Ohne Angabe wird eine variable Default-Laufzeit vergeben (siehe Backend-Konfiguration)"
            minDate={new Date()}
            valueFormat="DD.MM.YYYY"
            clearable
            {...form.getInputProps('validUntil')}
          />

          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Rechte ({form.values.rights.length} ausgewählt)
              </Text>
              <Group gap="xs">
                <Button size="xs" variant="light" onClick={selectAllRights} disabled={uniqueAvailableRights.length === 0}>
                  Alle auswählen
                </Button>
                <Button size="xs" variant="light" onClick={deselectAllRights}>
                  Alle abwählen
                </Button>
              </Group>
            </Group>

            {uniqueAvailableRights.length === 0 ? (
              <Alert icon={<IconAlertCircle size={16} />} color="yellow" mb="md">
                Sie haben keine Rechte, die Sie einem Token zuweisen können.
              </Alert>
            ) : (
              <ScrollArea h={250} style={{ border: '1px solid #dee2e6', borderRadius: 4, padding: 8 }}>
                <Stack gap="xs">
                  {uniqueAvailableRights.map((right) => (
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

          <Text size="sm" c="dimmed">
            Hinweis: Der generierte Token wird nur einmal angezeigt. Speichern Sie ihn an einem sicheren Ort!
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" loading={loading}>
              Erstellen
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
