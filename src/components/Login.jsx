import { useState, useEffect } from 'react';
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
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUser, IconUserShield } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { getOAuthProviders } from '../services/authService';
import { API_BASE_URL, FRONTEND_URL } from '../config.js';

export default function Login() {
  const { login, loginWithToken, loading } = useAuth();
  const [error, setError] = useState('');
  const [oauthProviders, setOauthProviders] = useState({});

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

  // OAuth-Provider beim Laden der Komponente abrufen
  useEffect(() => {
    const loadOAuthProviders = async () => {
      const providers = await getOAuthProviders();
      console.log('OAuth-Provider geladen:', providers);
      setOauthProviders(providers);
    };
    loadOAuthProviders();
  }, []);

  // Token aus URL-Query-Parameter nach OAuth-Redirect verarbeiten
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Token aus URL verwenden
      loginWithToken(token);
      
      // Token aus URL entfernen (aus Sicherheitsgründen)
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [loginWithToken]);

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

  const handleOAuthLogin = (providerUrl) => {
    // Redirect URI ist die konfigurierte Frontend-URL
    const redirectUri = FRONTEND_URL;
    const fullUrl = `${API_BASE_URL}${providerUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    // Weiterleitung zum OAuth-Provider - wird in einem Event-Handler aufgerufen
    window.location.assign(fullUrl);
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

            {Object.keys(oauthProviders).length > 0 && (
              <>
                <Divider label="Oder anmelden mit" labelPosition="center" />

                <Stack spacing="xs">
                  {Object.entries(oauthProviders).map(([key, provider]) => (
                    <Button
                      key={key}
                      variant="default"
                      fullWidth
                      leftSection={
                        provider.imageUrl ? (
                          <Box
                            style={{
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={provider.imageUrl}
                              alt={provider.name}
                              style={{
                                width: '24px',
                                height: '24px',
                                objectFit: 'contain',
                              }}
                              onError={(e) => {
                                console.error('Fehler beim Laden des Icons:', provider.imageUrl);
                                e.target.style.display = 'none';
                              }}
                            />
                          </Box>
                        ) : null
                      }
                      onClick={() => handleOAuthLogin(provider.url)}
                    >
                      {provider.name}
                    </Button>
                  ))}
                </Stack>
              </>
            )}

            <Divider label="Oder" labelPosition="center" />

            <Stack spacing="xs">
              <Text size="sm" c="dimmed" ta="center">
                Schnell-Login für Entwicklung:
              </Text>
              <Group grow>
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconUserShield size={16} />}
                  onClick={() => handleQuickLogin('devnull@frachtwerk.de', 'adminAdminAdmin')}
                  loading={loading}
                >
                  Admin-User
                </Button>
                <Button
                  variant="light"
                  color="grape"
                  leftSection={<IconUser size={16} />}
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
