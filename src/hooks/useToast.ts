import { useState, useCallback } from 'react';
import { type ToastProps } from '@/components/ui/Toast/Toast';

type ToastInput = Omit<ToastProps, 'id' | 'onClose'>;

interface UseToastReturn {
  toasts: ToastProps[];
  showToast: (toast: ToastInput) => string;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: ToastInput): string => {
    const id = Math.random().toString(36).substring(2, 9);

    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      },
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    clearToasts,
  };
};
