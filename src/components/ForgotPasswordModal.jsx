import { useState } from 'react';
import { Modal, TextInput, Button, Stack, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCircleCheck } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { requestPasswordReset } from '../services/resetCredentialsService';

export default function ForgotPasswordModal({ opened, onClose }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (value) => {
        if (!value) return 'Bitte E-Mail eingeben';
        if (!/^[^\s@]+@[^\s@]+$/.test(value)) return 'Ungültige E-Mail-Adresse';
        return null;
      },
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await requestPasswordReset(values.email);
    } catch {
      // Bewusst keine Fehleranzeige: Aus Sicherheitsgründen (kein User-Enumeration)
      // wird immer die gleiche generische Bestätigung gezeigt.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    form.reset();
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Passwort zurücksetzen" size="md">
      {submitted ? (
        <Stack>
          <Alert icon={<IconCircleCheck size={16} />} color="green" title="E-Mail versendet">
            Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link zum Zurücksetzen des
            Passworts versendet. Bitte prüfen Sie Ihr Postfach.
          </Alert>
          <Button onClick={handleClose} fullWidth>
            Schließen
          </Button>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Text size="sm" c="dimmed">
              Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres
              Passworts.
            </Text>
            <TextInput
              label="E-Mail"
              placeholder="name@example.com"
              required
              {...form.getInputProps('email')}
            />
            <Button type="submit" fullWidth loading={loading}>
              Link anfordern
            </Button>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

ForgotPasswordModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
