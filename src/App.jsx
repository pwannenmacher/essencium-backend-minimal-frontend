import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

// Importiere Mantine CSS
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import 'dayjs/locale/de';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <DatesProvider settings={{ locale: 'de' }}>
        <Notifications position="top-right" />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </DatesProvider>
    </MantineProvider>
  );
}

export default App
