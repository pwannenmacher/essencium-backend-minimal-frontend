import { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Container,
  Alert,
  Stack,
  Group,
  Text,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUser, IconUserShield } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? 'Bitte E-Mail eingeben' : null),
      password: (value) => (!value ? 'Bitte Passwort eingeben' : null),
    },
  });

  const handleSubmit = async (values) => {
    setError('');
    const result = await login(values.username, values.password);
    
    if (!result.success) {
      setError(result.error || 'Login fehlgeschlagen');
    }
  };

  const handleQuickLogin = async (username, password) => {
    form.setValues({ username, password });
    setError('');
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error || 'Login fehlgeschlagen');
    }
  };

  return (
    <Container size={420} my={100}>
      <Title ta="center" mb="xl">
        Essencium Login
      </Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fehler">
                {error}
              </Alert>
            )}

            <TextInput
              label="E-Mail"
              placeholder="devnull@frachtwerk.de"
              required
              {...form.getInputProps('username')}
            />

            <PasswordInput
              label="Passwort"
              placeholder="Passwort eingeben"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Anmelden
            </Button>

            <Divider label="Oder" labelPosition="center" />

            <Stack spacing="xs">
              <Text size="sm" c="dimmed" ta="center">
                Schnell-Login für Entwicklung:
              </Text>
              <Group grow>
                <Button
                  variant="light"
                  color="blue"
                  leftIcon={<IconUserShield size={16} />}
                  onClick={() => handleQuickLogin('devnull@frachtwerk.de', 'adminAdminAdmin')}
                  loading={loading}
                >
                  Admin-User
                </Button>
                <Button
                  variant="light"
                  color="grape"
                  leftIcon={<IconUser size={16} />}
                  onClick={() => handleQuickLogin('devnull_user@frachtwerk.de', 'userUserUser')}
                  loading={loading}
                >
                  Default-User
                </Button>
              </Group>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
