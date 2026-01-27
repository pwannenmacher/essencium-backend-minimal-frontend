import { useState, useEffect, useRef } from 'react';
import 'rapidoc';
import { Loader, Center, Alert, useMantineColorScheme } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { getOpenApiSpec } from '../services/openApiService';
import './ApiDocsViewer.css';

export default function ApiDocsViewer() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const rapidocRef = useRef(null);
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    loadSpec();
  }, []);

  useEffect(() => {
    if (rapidocRef.current && spec) {
        rapidocRef.current.loadSpec(spec);
    }
  }, [spec]);

  const loadSpec = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiSpec = await getOpenApiSpec();
      setSpec(apiSpec);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="Fehler" color="red" m="md">
        {error}
      </Alert>
    );
  }

  // RapiDoc configuration for better integration
  // render-style="read" gives a clean look similar to Redoc/Stoplight
  return (
    <div className="api-docs-viewer-container" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <rapi-doc
        ref={rapidocRef}
        render-style="read" 
        style={{ height: '100%', width: '100%' }}
        theme={colorScheme}
        show-header="false"
        show-info="true"
        allow-server-selection="false"
        allow-authentication="true"
        nav-bg-color={colorScheme === 'dark' ? '#1A1B1E' : '#f8f9fa'}
        nav-text-color={colorScheme === 'dark' ? '#c1c2c5' : '#495057'}
        bg-color={colorScheme === 'dark' ? '#1A1B1E' : '#ffffff'}
        text-color={colorScheme === 'dark' ? '#c1c2c5' : '#000000'}
        primary-color="#228be6"
        layout="row"
        schema-style="table"
      ></rapi-doc>
    </div>
  );
}
