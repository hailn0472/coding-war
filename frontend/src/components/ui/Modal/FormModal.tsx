import React from 'react';
import Modal from './Modal';
import { cn } from '@/utils';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  className?: string;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  submitDisabled = false,
  size = 'md',
  children,
  className,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      showCloseButton={!loading}
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Content */}
        <div className="space-y-4">{children}</div>

        {/* Form Actions */}
        {onSubmit && (
          <div className="flex justify-end space-x-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground focus:ring-ring rounded-md border bg-transparent px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={loading || submitDisabled}
              className={cn(
                'focus:ring-ring rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {loading ? 'Saving...' : submitText}
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default FormModal;
