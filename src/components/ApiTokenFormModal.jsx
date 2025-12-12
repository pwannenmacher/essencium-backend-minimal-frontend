import { useEffect, useContext, useState } from 'react';
import { Modal, TextInput, Button, Group, Checkbox, ScrollArea, Stack, Text, Alert } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { createApiToken, getTokenExpirationInfo } from '../services/apiTokenService';

export default function ApiTokenFormModal({ opened, onClose }) {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [expirationInfo, setExpirationInfo] = useState(null);
  const [loadingExpiration, setLoadingExpiration] = useState(false);

  const availableRights = user?.roles?.flatMap(role => 
    role.rights?.map(right => right.authority) || []
  ) || [];
  
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
      setLoading(false);
      form.reset();
      
      const fetchExpirationInfo = async () => {
        setLoadingExpiration(true);
        try {
          const info = await getTokenExpirationInfo(token);
          setExpirationInfo(info);
        } catch (error) {
          console.error('Fehler beim Laden der Token-Expiration-Info:', error);
          setExpirationInfo(null);
        } finally {
          setLoadingExpiration(false);
        }
      };
      
      fetchExpirationInfo();
    }
  }, [opened, token]);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} Tag${days !== 1 ? 'e' : ''}`);
    if (hours > 0) parts.push(`${hours} Stunde${hours !== 1 ? 'n' : ''}`);
    if (minutes > 0) parts.push(`${minutes} Minute${minutes !== 1 ? 'n' : ''}`);
    
    if (parts.length === 0) {
      return `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
    }
    
    return parts.join(', ');
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedData = {
        ...values,
        validUntil: values.validUntil || null,
      };

      const result = await createApiToken(token, formattedData);
      notifications.show({
        title: 'Erfolg',
        message: 'API-Token wurde erstellt',
        color: 'green',
      });
      
      setLoading(false);
      form.reset();
      
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
            description={
              loadingExpiration 
                ? 'Lade Default-Laufzeit...' 
                : expirationInfo 
                  ? `Ohne Angabe wird der Token für ${formatDuration(expirationInfo)} gültig sein`
                  : 'Ohne Angabe wird eine variable Default-Laufzeit vergeben'
            }
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

ApiTokenFormModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
