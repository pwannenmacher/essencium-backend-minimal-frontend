import { useEffect, useState } from 'react';
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Group,
  Switch,
  Select,
  MultiSelect,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import PropTypes from 'prop-types';

export default function UserFormModal({ opened, onClose, onSubmit, user, roles, mode = 'create' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const form = useForm({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      locale: 'de',
      roles: [],
      enabled: true,
      loginDisabled: false,
      phone: '',
      mobile: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'E-Mail ist erforderlich';
        if (!/^\S+@\S+$/.test(value)) return 'Ungültige E-Mail-Adresse';
        return null;
      },
      firstName: (value) => (!value ? 'Vorname ist erforderlich' : null),
      lastName: (value) => (!value ? 'Nachname ist erforderlich' : null),
      password: (value) => {
        if (mode === 'create' && !value) return 'Passwort ist erforderlich';
        return null;
      },
      locale: (value) => (!value ? 'Sprache ist erforderlich' : null),
      roles: (value) =>
        !value || value.length === 0 ? 'Mindestens eine Rolle ist erforderlich' : null,
    },
  });

  useEffect(() => {
    if (user && mode === 'edit') {
      form.setValues({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        password: '',
        locale: user.locale || 'de',
        roles: user.roles?.map((r) => r.name) || [],
        enabled: user.enabled ?? true,
        loginDisabled: user.loginDisabled ?? false,
        phone: user.phone || '',
        mobile: user.mobile || '',
      });
    } else if (mode === 'create') {
      form.reset();
    }
  }, [user, mode, opened]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const submitData = { ...values };
      if (mode === 'edit' && !submitData.password) {
        delete submitData.password;
      }

      await onSubmit(submitData);
      form.reset();
      onClose();
    } catch (err) {
      console.error('Formular-Fehler:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setError(null);
    onClose();
  };

  const roleOptions =
    roles?.map((role) => ({
      value: role.name || role,
      label: role.name || role,
    })) || [];

  const localeOptions = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={mode === 'create' ? 'Neuen Benutzer erstellen' : 'Benutzer bearbeiten'}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fehler">
              {error}
            </Alert>
          )}

          <TextInput
            label="E-Mail"
            placeholder="benutzer@example.com"
            required
            {...form.getInputProps('email')}
          />

          <Group grow>
            <TextInput
              label="Vorname"
              placeholder="Max"
              required
              {...form.getInputProps('firstName')}
            />

            <TextInput
              label="Nachname"
              placeholder="Mustermann"
              required
              {...form.getInputProps('lastName')}
            />
          </Group>

          {mode === 'create' && (
            <PasswordInput
              label="Passwort"
              placeholder="Sicheres Passwort"
              required
              description="Mindestens 8 Zeichen"
              {...form.getInputProps('password')}
            />
          )}

          {mode === 'edit' && (
            <PasswordInput
              label="Neues Passwort"
              placeholder="Leer lassen, um nicht zu ändern"
              description="Nur ausfüllen, wenn Passwort geändert werden soll"
              {...form.getInputProps('password')}
            />
          )}

          <Group grow>
            <TextInput
              label="Telefon"
              placeholder="+49 123 456789"
              {...form.getInputProps('phone')}
            />

            <TextInput
              label="Mobil"
              placeholder="+49 170 1234567"
              {...form.getInputProps('mobile')}
            />
          </Group>

          <Select
            label="Sprache"
            placeholder="Sprache auswählen"
            data={localeOptions}
            required
            {...form.getInputProps('locale')}
          />

          <MultiSelect
            label="Rollen"
            placeholder="Rollen auswählen"
            data={roleOptions}
            required
            searchable
            {...form.getInputProps('roles')}
          />

          <Group grow>
            <Switch
              label="Benutzer aktiviert"
              {...form.getInputProps('enabled', { type: 'checkbox' })}
            />

            <Switch
              label="Login deaktiviert"
              {...form.getInputProps('loginDisabled', { type: 'checkbox' })}
            />
          </Group>

          <Group position="right" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" loading={loading}>
              {mode === 'create' ? 'Erstellen' : 'Speichern'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

UserFormModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    locale: PropTypes.string,
    roles: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
      })
    ),
    enabled: PropTypes.bool,
    loginDisabled: PropTypes.bool,
    phone: PropTypes.string,
    mobile: PropTypes.string,
  }),
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ).isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
};
