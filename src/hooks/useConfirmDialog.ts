import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success';
}

interface UseConfirmDialogReturn {
  isOpen: boolean;
  options: ConfirmOptions | null;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
  loading: boolean;
}

export const useConfirmDialog = (): UseConfirmDialogReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);

  const showConfirm = useCallback(
    (confirmOptions: ConfirmOptions): Promise<boolean> => {
      return new Promise(resolve => {
        setOptions(confirmOptions);
        setIsOpen(true);
        setResolvePromise(() => resolve);
      });
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    setLoading(true);

    // Simulate async operation if needed
    await new Promise(resolve => setTimeout(resolve, 100));

    setLoading(false);
    setIsOpen(false);
    resolvePromise?.(true);
    setResolvePromise(null);
    setOptions(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(false);
    setResolvePromise(null);
    setOptions(null);
  }, [resolvePromise]);

  return {
    isOpen,
    options,
    showConfirm,
    handleConfirm,
    handleCancel,
    loading,
  };
};
