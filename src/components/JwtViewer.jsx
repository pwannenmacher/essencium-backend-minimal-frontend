import { Card, Text, Stack, Code, Box, Group, Badge, Divider } from '@mantine/core';
import { IconKey, IconClock, IconUser } from '@tabler/icons-react';
import { useContext, useMemo, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function JwtViewer() {
  const { token } = useContext(AuthContext);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const decodeJwt = (jwt) => {
    if (!jwt) return null;

    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      return { header, payload, signature: parts[2] };
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('de-DE');
  };

  const decoded = useMemo(() => decodeJwt(token), [token]);

  const tokenStatus = useMemo(() => {
    if (!decoded?.payload?.exp) return { expired: false, timeRemaining: '-' };

    const expTime = decoded.payload.exp * 1000;
    const expired = currentTime >= expTime;

    if (expired) {
      return { expired: true, timeRemaining: 'Abgelaufen' };
    }

    const remaining = expTime - currentTime;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return { expired: false, timeRemaining: `${minutes}m ${seconds}s` };
  }, [decoded, currentTime]);

  if (!token) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group mb="md">
          <IconKey size={20} />
          <Text fw={500}>Aktueller Access-Token</Text>
        </Group>
        <Text size="sm" c="dimmed">
          Kein Token verfügbar
        </Text>
      </Card>
    );
  }

  if (!decoded) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group mb="md">
          <IconKey size={20} />
          <Text fw={500}>Aktueller Access-Token</Text>
        </Group>
        <Text size="sm" c="red">
          Token konnte nicht dekodiert werden
        </Text>
      </Card>
    );
  }

  const { header, payload, signature } = decoded;
  const { expired, timeRemaining } = tokenStatus;

  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconKey size={20} />
          <Text fw={500}>Aktueller Access-Token (JWT)</Text>
        </Group>
        {expired ? <Badge color="red">Abgelaufen</Badge> : <Badge color="green">Gültig</Badge>}
      </Group>

      <Stack gap="md">
        <Box>
          <Text size="sm" fw={600} mb="xs" c="blue">
            Header
          </Text>
          <Code block style={{ fontSize: '12px' }}>
            {JSON.stringify(header, null, 2)}
          </Code>
        </Box>

        <Divider />

        <Box>
          <Text size="sm" fw={600} mb="xs" c="purple">
            Payload
          </Text>
          <Stack gap="xs" mb="sm">
            {payload.sub && (
              <Group gap="xs">
                <IconUser size={14} />
                <Text size="xs" fw={500}>
                  Subject:
                </Text>
                <Text size="xs">{payload.sub}</Text>
              </Group>
            )}
            {payload.iat && (
              <Group gap="xs">
                <IconClock size={14} />
                <Text size="xs" fw={500}>
                  Ausgestellt:
                </Text>
                <Text size="xs">{formatDate(payload.iat)}</Text>
              </Group>
            )}
            {payload.exp && (
              <Group gap="xs">
                <IconClock size={14} />
                <Text size="xs" fw={500}>
                  Läuft ab:
                </Text>
                <Text size="xs">{formatDate(payload.exp)}</Text>
                {!expired && (
                  <Badge size="xs" color="orange">
                    {timeRemaining}
                  </Badge>
                )}
              </Group>
            )}
            {payload.authorities && (
              <Box>
                <Text size="xs" fw={500} mb={4}>
                  Authorities:
                </Text>
                <Group gap={4}>
                  {payload.authorities.map((auth, idx) => (
                    <Badge key={idx} size="xs" variant="light">
                      {auth.authority || auth}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}
          </Stack>
          <Code block style={{ fontSize: '12px' }}>
            {JSON.stringify(payload, null, 2)}
          </Code>
        </Box>

        <Divider />

        <Box>
          <Text size="sm" fw={600} mb="xs" c="teal">
            Signature
          </Text>
          <Code
            block
            style={{
              fontSize: '9px',
              wordBreak: 'break-all',
              maxHeight: '60px',
              overflow: 'auto',
            }}
          >
            {signature}
          </Code>
        </Box>

        <Box>
          <Text size="sm" fw={600} mb="xs" c="gray">
            Raw Token
          </Text>
          <Code
            block
            style={{
              fontSize: '9px',
              wordBreak: 'break-all',
              maxHeight: '80px',
              overflow: 'auto',
            }}
          >
            {token}
          </Code>
        </Box>
      </Stack>
    </Card>
  );
}
