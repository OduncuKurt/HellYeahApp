import React, { createContext, ReactNode, useContext, useState } from 'react';
import CustomModal, { ModalType } from '../components/CustomModal';

interface ModalOptions {
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  showSuccess: (title: string, message: string, onConfirm?: () => void) => void;
  showError: (title: string, message: string, onConfirm?: () => void) => void;
  showWarning: (title: string, message: string, onConfirm?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  showCustomConfirm: (
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({
    title: '',
    message: '',
    type: 'info',
  });

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'success',
      title,
      message,
      confirmText: 'Tamam',
      onConfirm: () => {
        hideModal();
        if (onConfirm) onConfirm();
      },
      onCancel: hideModal,
    });
  };

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'error',
      title,
      message,
      confirmText: 'Tamam',
      onConfirm: () => {
        hideModal();
        if (onConfirm) onConfirm();
      },
      onCancel: hideModal,
    });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'warning',
      title,
      message,
      confirmText: 'Tamam',
      onConfirm: () => {
        hideModal();
        if (onConfirm) onConfirm();
      },
      onCancel: hideModal,
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showModal({
      type: 'confirm',
      title,
      message,
      confirmText: 'Evet',
      cancelText: 'Hayır',
      onConfirm: () => {
        hideModal();
        onConfirm();
      },
      onCancel: () => {
        hideModal();
        if (onCancel) onCancel();
      },
    });
  };

  const showCustomConfirm = (
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showModal({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        hideModal();
        onConfirm();
      },
      onCancel: () => {
        hideModal();
        if (onCancel) onCancel();
      },
    });
  };

  const value: ModalContextType = {
    showModal,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    showCustomConfirm,
    hideModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <CustomModal
        visible={visible}
        type={modalOptions.type}
        title={modalOptions.title}
        message={modalOptions.message}
        confirmText={modalOptions.confirmText}
        cancelText={modalOptions.cancelText}
        onConfirm={modalOptions.onConfirm}
        onCancel={modalOptions.onCancel}
        singleButton={modalOptions.type !== 'confirm'}
      />
    </ModalContext.Provider>
  );
};
