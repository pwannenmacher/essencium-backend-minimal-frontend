import { useState } from 'react';
import { Card, Text, Group, Badge, Stack, Title, Divider, Button } from '@mantine/core';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconWorld,
  IconShield,
  IconEdit,
  IconHash,
} from '@tabler/icons-react';
import PropTypes from 'prop-types';
import EditProfileModal from './EditProfileModal';

export default function UserProfile({ user, onUpdate }) {
  const [editModalOpened, setEditModalOpened] = useState(false);

  if (!user) return null;

  const handleSuccess = () => {
    onUpdate?.();
  };

  return (
    <>
      <Card withBorder padding="lg" radius="md">
        <Stack spacing="md">
          <Group position="apart">
            <Title order={3}>Benutzerprofil</Title>
            <Group spacing="xs">
              {user.enabled ? (
                <Badge color="green">Aktiv</Badge>
              ) : (
                <Badge color="red">Deaktiviert</Badge>
              )}
              <Button
                size="xs"
                leftSection={<IconEdit size={14} />}
                variant="light"
                onClick={() => setEditModalOpened(true)}
              >
                Bearbeiten
              </Button>
            </Group>
          </Group>

          <Divider />

          <Stack spacing="sm">
            <Group>
              <IconHash size={20} />
              <Text weight={500}>ID:</Text>
              <Text>{user.id}</Text>
            </Group>

            <Group>
              <IconUser size={20} />
              <Text weight={500}>Name:</Text>
              <Text>
                {user.firstName} {user.lastName}
              </Text>
            </Group>

            <Group>
              <IconMail size={20} />
              <Text weight={500}>E-Mail:</Text>
              <Text>{user.email}</Text>
            </Group>

            {user.phone && (
              <Group>
                <IconPhone size={20} />
                <Text weight={500}>Telefon:</Text>
                <Text>{user.phone}</Text>
              </Group>
            )}

            {user.mobile && (
              <Group>
                <IconPhone size={20} />
                <Text weight={500}>Mobil:</Text>
                <Text>{user.mobile}</Text>
              </Group>
            )}

            <Group>
              <IconWorld size={20} />
              <Text weight={500}>Sprache:</Text>
              <Text>{user.locale}</Text>
            </Group>

            {user.source && (
              <Group>
                <Text weight={500}>Quelle:</Text>
                <Text c="dimmed" size="sm">
                  {user.source}
                </Text>
              </Group>
            )}
          </Stack>

          {user.roles && user.roles.length > 0 && (
            <>
              <Divider />
              <Stack spacing="xs">
                <Group>
                  <IconShield size={20} />
                  <Text weight={500}>Rollen:</Text>
                </Group>
                <Group spacing="xs">
                  {user.roles.map((role) => (
                    <Badge key={role.name} color="blue" variant="light">
                      {role.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </>
          )}

          {user.loginDisabled && (
            <Badge color="orange" fullWidth>
              Login deaktiviert
            </Badge>
          )}
        </Stack>
      </Card>

      <EditProfileModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

UserProfile.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    mobile: PropTypes.string,
    locale: PropTypes.string,
    source: PropTypes.string,
    roles: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
      })
    ),
    enabled: PropTypes.bool,
    loginDisabled: PropTypes.bool,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};
