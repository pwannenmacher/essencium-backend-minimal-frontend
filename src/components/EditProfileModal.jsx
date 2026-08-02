import { useState } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Select,
  Alert,
  Tabs,
  PasswordInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUser, IconLock } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { patchMe, updateMyPassword } from '../services/userService';
import { validatePassword, validatePasswordConfirmation } from '../utils/passwordValidation';
import { notifications } from '@mantine/notifications';

export default function EditProfileModal({ opened, onClose, onSuccess }) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const profileForm = useForm({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      mobile: user?.mobile || '',
      locale: user?.locale || 'de',
    },
    validate: {
      firstName: (value) => (!value ? 'Vorname ist erforderlich' : null),
      lastName: (value) => (!value ? 'Nachname ist erforderlich' : null),
    },
  });

  const passwordForm = useForm({
    initialValues: {
      password: '',
      verification: '',
    },
    validate: {
      password: validatePassword,
      verification: (value, values) => validatePasswordConfirmation(value, values.password),
    },
  });

  const handleProfileSubmit = async (values) => {
    setLoading(true);
    setError(null);

    try {
      await patchMe(token, values, user?.id);
      notifications.show({
        title: 'Erfolg',
        message: 'Profil wurde aktualisiert',
        color: 'green',
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Profil-Update-Fehler:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    setLoading(true);
    setError(null);

    try {
      await updateMyPassword(token, {
        password: values.password,
        verification: values.verification,
      });
      notifications.show({
        title: 'Erfolg',
        message: 'Passwort wurde geändert',
        color: 'green',
      });
      passwordForm.reset();
      onClose();
    } catch (err) {
      console.error('Passwort-Änderungs-Fehler:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const localeOptions = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];

  return (
    <Modal opened={opened} onClose={onClose} title="Mein Profil bearbeiten" size="md">
      <Tabs defaultValue="profile">
        <Tabs.List>
          <Tabs.Tab value="profile" leftSection={<IconUser size={14} />}>
            Profildaten
          </Tabs.Tab>
          <Tabs.Tab value="password" leftSection={<IconLock size={14} />}>
            Passwort ändern
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" pt="md">
          <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
            <Stack gap="md">
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fehler">
                  {error}
                </Alert>
              )}

              <Group grow>
                <TextInput
                  label="Vorname"
                  placeholder="Max"
                  required
                  {...profileForm.getInputProps('firstName')}
                />

                <TextInput
                  label="Nachname"
                  placeholder="Mustermann"
                  required
                  {...profileForm.getInputProps('lastName')}
                />
              </Group>

              <Group grow>
                <TextInput
                  label="Telefon"
                  placeholder="+49 123 456789"
                  {...profileForm.getInputProps('phone')}
                />

                <TextInput
                  label="Mobil"
                  placeholder="+49 170 1234567"
                  {...profileForm.getInputProps('mobile')}
                />
              </Group>

              <Select
                label="Sprache"
                placeholder="Sprache auswählen"
                data={localeOptions}
                {...profileForm.getInputProps('locale')}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="submit" loading={loading}>
                  Speichern
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="password" pt="md">
          <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
            <Stack gap="md">
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fehler">
                  {error}
                </Alert>
              )}

              <PasswordInput
                label="Neues Passwort"
                placeholder="Mindestens 8 Zeichen"
                required
                {...passwordForm.getInputProps('password')}
              />

              <PasswordInput
                label="Passwort bestätigen"
                placeholder="Passwort wiederholen"
                required
                {...passwordForm.getInputProps('verification')}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="submit" loading={loading} color="orange">
                  Passwort ändern
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

EditProfileModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
