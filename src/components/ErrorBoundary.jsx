import { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Container, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

/**
 * Fängt Render-Exceptions der Kind-Komponenten ab und zeigt eine
 * Fallback-UI mit Reload-Möglichkeit statt eines weißen Bildschirms.
 * Bewusst als Klassen-Komponente: React bietet für Error Boundaries
 * keine Hook-API.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unerwarteter Render-Fehler:', error, info.componentStack);
  }

  handleReload = () => {
    globalThis.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" pt="xl">
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            title="Unerwarteter Fehler"
            variant="light"
          >
            <Stack gap="md">
              <Text size="sm">
                Die Anwendung ist auf einen unerwarteten Fehler gestoßen. Bitte laden Sie die Seite
                neu – Ihre Sitzung bleibt dabei erhalten.
              </Text>
              <Button onClick={this.handleReload} color="red" variant="light" w="fit-content">
                Neu laden
              </Button>
            </Stack>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
