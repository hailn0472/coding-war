import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const variantConfig = {
    default: {
      icon: Info,
      iconColor: 'text-blue-500',
      confirmButtonClass:
        'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      confirmButtonClass: 'bg-yellow-500 text-white hover:bg-yellow-600',
    },
    danger: {
      icon: XCircle,
      iconColor: 'text-red-500',
      confirmButtonClass: 'bg-red-500 text-white hover:bg-red-600',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      confirmButtonClass: 'bg-blue-500 text-white hover:bg-blue-600',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      confirmButtonClass: 'bg-green-500 text-white hover:bg-green-600',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <div className="space-y-4">
        {/* Icon and Message */}
        <div className="flex items-start space-x-3">
          <Icon
            className={cn('mt-0.5 h-6 w-6 flex-shrink-0', config.iconColor)}
          />
          <p className="text-muted-foreground text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground focus:ring-ring rounded-md border bg-transparent px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'focus:ring-ring rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              config.confirmButtonClass
            )}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
