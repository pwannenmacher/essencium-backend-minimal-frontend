import { useState } from 'react';
import { Modal, Group, Button } from '@mantine/core';
import PropTypes from 'prop-types';

/**
 * Bestätigungs-Dialog für destruktive Aktionen (zuvor in allen
 * Listen-Komponenten dupliziert) mit eingebautem Doppelklick-Schutz:
 * Während onConfirm läuft, zeigt der Bestätigen-Button einen Spinner,
 * Abbrechen und Schließen sind gesperrt.
 */
export default function ConfirmActionModal({
  opened,
  onClose,
  onConfirm,
  title,
  confirmLabel,
  confirmColor = 'red',
  centered = false,
  children,
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (!busy) onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      centered={centered}
      withCloseButton={!busy}
    >
      {children}
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={handleClose} disabled={busy}>
          Abbrechen
        </Button>
        <Button color={confirmColor} onClick={handleConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}

ConfirmActionModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string.isRequired,
  confirmColor: PropTypes.string,
  centered: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
