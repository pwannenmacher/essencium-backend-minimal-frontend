import { useState } from 'react';
import {
  Paper,
  PasswordInput,
  Button,
  Title,
  Container,
  Alert,
  Stack,
  Text,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { setNewPassword } from '../services/resetCredentialsService';
import { validatePassword, validatePasswordConfirmation } from '../utils/passwordValidation';

const getResetToken = () => new URLSearchParams(globalThis.location.search).get('token');

const goToLogin = () => {
  globalThis.location.assign(globalThis.location.origin + '/');
};

export default function SetPassword() {
  const [token] = useState(getResetToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: { password: '', verification: '' },
    validate: {
      password: validatePassword,
      verification: (value, values) => validatePasswordConfirmation(value, values.password),
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await setNewPassword(values.password, token);
      setSuccess(true);
      // Token nach erfolgreicher Nutzung aus der URL entfernen.
      globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
    } catch {
      setError(
        'Das Passwort konnte nicht gesetzt werden. Der Link ist möglicherweise ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={100}>
      <Title ta="center" mb="xl">
        Neues Passwort setzen
      </Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        {!token && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Ungültiger Link">
            <Stack gap="xs">
              <Text size="sm">
                Dieser Link enthält keinen gültigen Reset-Token. Bitte fordern Sie das Zurücksetzen
                erneut an.
              </Text>
              <Anchor size="sm" onClick={goToLogin}>
                Zurück zur Anmeldung
              </Anchor>
            </Stack>
          </Alert>
        )}

        {token && success && (
          <Stack>
            <Alert icon={<IconCircleCheck size={16} />} color="green" title="Passwort geändert">
              Ihr Passwort wurde erfolgreich gesetzt. Sie können sich jetzt anmelden.
            </Alert>
            <Button onClick={goToLogin} fullWidth>
              Zur Anmeldung
            </Button>
          </Stack>
        )}

        {token && !success && (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fehler">
                  {error}
                </Alert>
              )}
              <PasswordInput
                label="Neues Passwort"
                placeholder="Neues Passwort eingeben"
                required
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label="Passwort bestätigen"
                placeholder="Passwort wiederholen"
                required
                {...form.getInputProps('verification')}
              />
              <Button type="submit" fullWidth loading={loading}>
                Passwort setzen
              </Button>
              <Anchor size="sm" ta="center" onClick={goToLogin}>
                Zurück zur Anmeldung
              </Anchor>
            </Stack>
          </form>
        )}
      </Paper>
    </Container>
  );
}
