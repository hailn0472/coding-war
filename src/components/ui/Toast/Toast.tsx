import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils';

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  variant = 'default',
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variantConfig = {
    default: {
      icon: Info,
      className: 'bg-background border-border',
      iconColor: 'text-blue-500',
    },
    success: {
      icon: CheckCircle,
      className:
        'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
      iconColor: 'text-green-500',
    },
    error: {
      icon: XCircle,
      className: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      className:
        'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
      iconColor: 'text-yellow-500',
    },
    info: {
      icon: Info,
      className:
        'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative flex w-full max-w-sm items-start space-x-3 rounded-lg border p-4 shadow-lg',
        'animate-in slide-in-from-right-full duration-300',
        config.className
      )}
      role="alert"
    >
      {/* Icon */}
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', config.iconColor)} />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-foreground mb-1 text-sm font-medium">{title}</p>
        )}
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(id)}
        className="ring-offset-background focus:ring-ring flex-shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
