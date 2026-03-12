import React, { createContext, useContext } from 'react';
import { useToast } from '@/hooks/useToast';
import ToastContainer, {
  type ToastPosition,
} from '@/components/ui/Toast/ToastContainer';
import { type ToastProps } from '@/components/ui/Toast/Toast';

type ToastInput = Omit<ToastProps, 'id' | 'onClose'>;

interface ToastContextType {
  showToast: (toast: ToastInput) => string;
  hideToast: (id: string) => void;
  clearToasts: () => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const { toasts, showToast, hideToast, clearToasts } = useToast();

  const success = (message: string, title?: string) =>
    showToast({ message, title, variant: 'success' });

  const error = (message: string, title?: string) =>
    showToast({ message, title, variant: 'error' });

  const warning = (message: string, title?: string) =>
    showToast({ message, title, variant: 'warning' });

  const info = (message: string, title?: string) =>
    showToast({ message, title, variant: 'info' });

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={position}
        maxToasts={maxToasts}
      />
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
