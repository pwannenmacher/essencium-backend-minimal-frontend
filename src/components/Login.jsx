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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: {
      username: 'devnull@frachtwerk.de',
      password: 'adminAdminAdmin',
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
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
