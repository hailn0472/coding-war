import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/utils';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success';
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
  variant = 'info',
}) => {
  const variantConfig = {
    default: {
      icon: Info,
      iconColor: 'text-blue-500',
      buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      buttonClass: 'bg-yellow-500 text-white hover:bg-yellow-600',
    },
    danger: {
      icon: XCircle,
      iconColor: 'text-red-500',
      buttonClass: 'bg-red-500 text-white hover:bg-red-600',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      buttonClass: 'bg-blue-500 text-white hover:bg-blue-600',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      buttonClass: 'bg-green-500 text-white hover:bg-green-600',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
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

        {/* Action */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className={cn(
              'focus:ring-ring rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
              config.buttonClass
            )}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDialog;
