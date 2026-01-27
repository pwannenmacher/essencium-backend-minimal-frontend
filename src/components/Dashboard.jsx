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
import { useState } from 'react';
import { IconLogout, IconUser, IconUsers, IconShieldLock, IconApiApp, IconShield, IconDeviceDesktop, IconApi } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import UserProfile from './UserProfile';
import UserRolesRights from './UserRolesRights';
import UserTokens from './UserTokens';
import UserList from './UserList';
import RoleList from './RoleList';
import ApiTokenList from './ApiTokenList';
import ApiTokenAdminList from './ApiTokenAdminList';
import SessionTokenAdminList from './SessionTokenAdminList';
import JwtViewer from './JwtViewer';
import ApiDocsViewer from './ApiDocsViewer';

export default function Dashboard() {
  const { user, logout, loading, token } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileUpdate = () => {
    globalThis.location.reload();
  };

  // Prüfe ob User die notwendigen Rechte hat
  const hasApiTokenRight = user?.roles?.some(role => 
    role.rights?.some(right => right.authority === 'API_TOKEN')
  ) || false;
  
  const hasApiTokenAdminRight = user?.roles?.some(role => 
    role.rights?.some(right => right.authority === 'API_TOKEN_ADMIN')
  ) || false;

  const hasRoleReadRight = user?.roles?.some(role => 
    role.rights?.some(right => right.authority === 'ROLE_READ')
  ) || false;

  const hasSessionTokenAdminRight = user?.roles?.some(role => 
    role.rights?.some(right => right.authority === 'SESSION_TOKEN_ADMIN')
  ) || false;

  const canManagePersonalTokens = hasApiTokenRight || hasApiTokenAdminRight;

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
              <ThemeToggle />
              <Badge color="green" size="lg">
                Angemeldet
              </Badge>
              <Button
                leftSection={<IconLogout size={18} />}
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

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="profile" icon={<IconUser size={14} />}>
                Mein Profil
              </Tabs.Tab>
              <Tabs.Tab value="users" icon={<IconUsers size={14} />}>
                Alle Benutzer
              </Tabs.Tab>
              {hasRoleReadRight && (
                <Tabs.Tab value="roles" icon={<IconShieldLock size={14} />}>
                  Rollen-Verwaltung
                </Tabs.Tab>
              )}
              {canManagePersonalTokens && (
                <Tabs.Tab value="apitokens" icon={<IconApiApp size={14} />}>
                  API-Tokens
                </Tabs.Tab>
              )}
              {hasApiTokenAdminRight && (
                <Tabs.Tab value="apitokensadmin" icon={<IconShield size={14} />}>
                  API-Token Admin
                </Tabs.Tab>
              )}
              {hasSessionTokenAdminRight && (
                <Tabs.Tab value="sessiontokensadmin" icon={<IconDeviceDesktop size={14} />}>
                  Session-Token Admin
                </Tabs.Tab>
              )}
              <Tabs.Tab value="api-docs" icon={<IconApi size={14} />}>
                API-Dokumentation
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="profile" pt="lg">
              <SimpleGrid cols={2} spacing="lg" breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
                <Stack spacing="lg">
                  <UserProfile user={user} onUpdate={handleProfileUpdate} />
                  <UserRolesRights />
                </Stack>

                <Stack spacing="lg">
                  <UserTokens />
                  <JwtViewer />
                </Stack>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="users" pt="lg">
              <UserList active={activeTab === 'users'} />
            </Tabs.Panel>

            {hasRoleReadRight && (
              <Tabs.Panel value="roles" pt="lg">
                <RoleList active={activeTab === 'roles'} />
              </Tabs.Panel>
            )}

            {canManagePersonalTokens && (
              <Tabs.Panel value="apitokens" pt="lg">
                <ApiTokenList active={activeTab === 'apitokens'} />
              </Tabs.Panel>
            )}

            {hasApiTokenAdminRight && (
              <Tabs.Panel value="apitokensadmin" pt="lg">
                <ApiTokenAdminList active={activeTab === 'apitokensadmin'} />
              </Tabs.Panel>
            )}

            {hasSessionTokenAdminRight && (
              <Tabs.Panel value="sessiontokensadmin" pt="lg">
                <SessionTokenAdminList active={activeTab === 'sessiontokensadmin'} />
              </Tabs.Panel>
            )}

            <Tabs.Panel value="api-docs" pt="lg">
              {activeTab === 'api-docs' && <ApiDocsViewer />}
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
}
