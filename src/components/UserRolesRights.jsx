import { useState, useEffect } from 'react';
import { Card, Text, Stack, Title, Badge, Group, Loader, Alert } from '@mantine/core';
import { IconKey, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useAuthTokenRef } from '../hooks/useAuthTokenRef';
import { getMyRoles, getMyRights } from '../services/userService';

export default function UserRolesRights() {
  const { isAuthenticated } = useAuth();
  const tokenRef = useAuthTokenRef();
  const [roles, setRoles] = useState([]);
  const [rights, setRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const [rolesData, rightsData] = await Promise.all([
          getMyRoles(tokenRef.current),
          getMyRights(tokenRef.current),
        ]);

        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setRights(Array.isArray(rightsData) ? rightsData : []);
      } catch (err) {
        console.error('Fehler beim Laden von Rollen/Rechten:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, tokenRef]);

  if (loading) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group position="center">
          <Loader size="sm" />
          <Text>Lade Berechtigungen...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fehler">
          {error}
        </Alert>
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" radius="md">
      <Stack spacing="lg">
        {/* Rollen */}
        <Stack spacing="sm">
          <Title order={4}>Rollen</Title>
          {roles.length > 0 ? (
            <Group spacing="xs">
              {roles.map((role) => (
                <Badge key={role.name || role} color="blue" size="lg" variant="light">
                  {role.name || role}
                </Badge>
              ))}
            </Group>
          ) : (
            <Text c="dimmed" size="sm">
              Keine Rollen zugewiesen
            </Text>
          )}
        </Stack>

        {/* Rechte */}
        <Stack spacing="sm">
          <Group>
            <IconKey size={20} />
            <Title order={4}>Rechte / Permissions</Title>
          </Group>
          {rights.length > 0 ? (
            <Stack spacing={4}>
              {rights.map((right) => (
                <Group key={right.authority || right} spacing="xs">
                  <Badge color="green" size="sm" variant="dot">
                    {right.authority || right}
                  </Badge>
                  {right.description && (
                    <Text size="xs" c="dimmed">
                      {right.description}
                    </Text>
                  )}
                </Group>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              Keine Rechte zugewiesen
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
