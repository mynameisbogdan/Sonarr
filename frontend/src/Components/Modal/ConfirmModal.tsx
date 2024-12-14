import React, { useEffect } from 'react';
import keyboardShortcuts from 'Components/keyboardShortcuts';
import Button from 'Components/Link/Button';
import SpinnerButton from 'Components/Link/SpinnerButton';
import Modal from 'Components/Modal/Modal';
import ModalBody from 'Components/Modal/ModalBody';
import ModalContent from 'Components/Modal/ModalContent';
import ModalFooter from 'Components/Modal/ModalFooter';
import ModalHeader from 'Components/Modal/ModalHeader';
import { kinds, sizes } from 'Helpers/Props';
import { Kind } from 'Helpers/Props/kinds';
import { Size } from 'Helpers/Props/sizes';

interface ConfirmModalProps {
  isOpen: boolean;
  kind?: Kind;
  size?: Size;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancelButton?: boolean;
  isSpinning?: boolean;
  onConfirm(): void;
  onCancel(): void;
  bindShortcut(shortcut: string, fn: () => void): void;
  unbindShortcut(shortcut: string, fn: () => void): void;
}

function ConfirmModal(props: ConfirmModalProps) {
  const {
    isOpen,
    kind = kinds.PRIMARY,
    size = sizes.MEDIUM,
    title,
    message,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    hideCancelButton = false,
    isSpinning = false,
    onConfirm,
    onCancel,
    bindShortcut,
    unbindShortcut,
  } = props;

  useEffect(() => {
    if (isOpen) {
      bindShortcut('enter', onConfirm);

      return () => unbindShortcut('enter', onConfirm);
    }

    return;
  }, [bindShortcut, unbindShortcut, isOpen, onConfirm]);

  return (
    <Modal isOpen={isOpen} size={size} onModalClose={onCancel}>
      <ModalContent onModalClose={onCancel}>
        <ModalHeader>{title}</ModalHeader>

        <ModalBody>{message}</ModalBody>

        <ModalFooter>
          {hideCancelButton ? null : (
            <Button kind={kinds.DEFAULT} onPress={onCancel}>
              {cancelLabel}
            </Button>
          )}

          <SpinnerButton
            autoFocus={true}
            kind={kind}
            isSpinning={isSpinning}
            onPress={onConfirm}
          >
            {confirmLabel}
          </SpinnerButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default keyboardShortcuts(ConfirmModal);
