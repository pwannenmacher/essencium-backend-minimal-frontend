import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Title,
  Tabs,
  Loader,
  Center,
  Stack,
  Text,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconApi } from '@tabler/icons-react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './SwaggerUIViewer.css';
import { getOpenApiSpec, extractTags, filterSpecByTag } from '../services/openApiService';
import { API_BASE_URL } from '../config';

export default function SwaggerUIViewer() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  // Lade die OpenAPI-Spezifikation beim Mount
  useEffect(() => {
    loadSpec();
  }, []);

  const loadSpec = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiSpec = await getOpenApiSpec();
      setSpec(apiSpec);
      
      // Setze den ersten Tab als aktiv
      const tags = extractTags(apiSpec);
      if (tags.length > 0) {
        setActiveTab(tags[0].name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Extrahiere Tags für die Tabs
  const tags = useMemo(() => {
    if (!spec) return [];
    return extractTags(spec);
  }, [spec]);

  // Filtere die Spec basierend auf dem aktiven Tab
  const filteredSpec = useMemo(() => {
    if (!spec || !activeTab) return null;
    return filterSpecByTag(spec, activeTab);
  }, [spec, activeTab]);

  if (loading) {
    return (
      <Container size="xl" my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Center>
            <Stack align="center" spacing="md">
              <Loader size="lg" />
              <Text>Lade API-Dokumentation...</Text>
            </Stack>
          </Center>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Alert icon={<IconAlertCircle size={16} />} title="Fehler" color="red">
            {error}
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" my={40}>
      <Stack spacing="lg">
        <Paper withBorder shadow="md" p={30} radius="md">
          <Title order={2} mb="lg">API-Dokumentation</Title>

          {tags.length === 0 ? (
            <Alert icon={<IconAlertCircle size={16} />} title="Keine API-Dokumentation verfügbar" color="yellow">
              Es wurden keine Controller in der OpenAPI-Spezifikation gefunden.
            </Alert>
          ) : (
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                {tags.map(tag => (
                  <Tabs.Tab 
                    key={tag.name} 
                    value={tag.name}
                    leftSection={<IconApi size={14} />}
                  >
                    {tag.name.replace('Controller', '')}
                  </Tabs.Tab>
                ))}
              </Tabs.List>

              {tags.map(tag => (
                <Tabs.Panel key={tag.name} value={tag.name} pt="lg">
                  {activeTab === tag.name && filteredSpec && (
                    <>
                      {tag.description && (
                        <Text size="sm" c="dimmed" mb="md">
                          {tag.description}
                        </Text>
                      )}
                      <SwaggerUI
                        spec={filteredSpec}
                        docExpansion="list"
                        defaultModelsExpandDepth={1}
                        defaultModelExpandDepth={1}
                        displayRequestDuration={true}
                        filter={true}
                        tryItOutEnabled={true}
                        requestInterceptor={(req) => {
                          // Füge Credentials hinzu, um Cookies zu senden
                          req.credentials = 'include';
                          return req;
                        }}
                        onComplete={(swaggerApi) => {
                          // Optional: Callback wenn SwaggerUI fertig geladen ist
                          console.log('SwaggerUI geladen für:', tag.name);
                        }}
                      />
                    </>
                  )}
                </Tabs.Panel>
              ))}
            </Tabs>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
