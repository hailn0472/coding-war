import React from 'react';
import Toast, { type ToastProps } from './Toast';
import { cn } from '@/utils';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

interface ToastContainerProps {
  toasts: ToastProps[];
  position?: ToastPosition;
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Limit the number of toasts displayed
  const displayedToasts = toasts.slice(0, maxToasts);

  if (displayedToasts.length === 0) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-50 flex flex-col space-y-2',
        positionClasses[position]
      )}
    >
      {displayedToasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
