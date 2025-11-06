import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  SimpleGrid,
  Loader,
  Center,
  Tabs,
} from '@mantine/core';
import { IconLogout, IconKey, IconUser, IconUsers, IconShieldLock, IconApiApp } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';
import UserRolesRights from './UserRolesRights';
import UserTokens from './UserTokens';
import UserList from './UserList';
import RoleList from './RoleList';
import ApiTokenList from './ApiTokenList';

export default function Dashboard() {
  const { user, logout, loading, token } = useAuth();

  const handleProfileUpdate = () => {
    // User-Daten werden automatisch durch den AuthContext neu geladen
    window.location.reload();
  };

  if (!user && token) {
    return (
      <Container size="xl" my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Center>
            <Stack align="center" spacing="md">
              <Loader size="lg" />
              <Text>Lade Benutzerdaten...</Text>
            </Stack>
          </Center>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" my={40}>
      <Stack spacing="lg">
        <Paper withBorder shadow="md" p={30} radius="md">
          <Group position="apart" mb="lg">
            <Title order={2}>Dashboard</Title>
            <Group spacing="sm">
              <Badge color="green" size="lg">
                Angemeldet
              </Badge>
              <Button
                leftIcon={<IconLogout size={18} />}
                color="red"
                onClick={logout}
                loading={loading}
                variant="light"
                size="sm"
              >
                Abmelden
              </Button>
            </Group>
          </Group>

          <Tabs defaultValue="profile">
            <Tabs.List>
              <Tabs.Tab value="profile" icon={<IconUser size={14} />}>
                Mein Profil
              </Tabs.Tab>
              <Tabs.Tab value="users" icon={<IconUsers size={14} />}>
                Alle Benutzer
              </Tabs.Tab>
              <Tabs.Tab value="roles" icon={<IconShieldLock size={14} />}>
                Rollen-Verwaltung
              </Tabs.Tab>
              <Tabs.Tab value="apitokens" icon={<IconApiApp size={14} />}>
                API-Tokens
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="profile" pt="lg">
              <SimpleGrid cols={2} spacing="lg" breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
                {/* Linke Spalte: Benutzerprofil */}
                <Stack spacing="lg">
                  <UserProfile user={user} onUpdate={handleProfileUpdate} />
                  <UserRolesRights />
                </Stack>

                {/* Rechte Spalte: Tokens und Info */}
                <Stack spacing="lg">
                  <UserTokens />
            
                </Stack>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="users" pt="lg">
              <UserList />
            </Tabs.Panel>

            <Tabs.Panel value="roles" pt="lg">
              <RoleList />
            </Tabs.Panel>

            <Tabs.Panel value="apitokens" pt="lg">
              <ApiTokenList />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
}
