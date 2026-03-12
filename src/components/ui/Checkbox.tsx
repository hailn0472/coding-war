import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <div className="relative">
            <input
              type="checkbox"
              className={cn(
                'border-primary ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground peer h-4 w-4 shrink-0 rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500',
                className
              )}
              ref={ref}
              {...props}
            />
            <Check className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100" />
          </div>
          {(label || description) && (
            <div className="grid gap-1.5 leading-none">
              {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {label}
                </label>
              )}
              {description && (
                <p className="text-muted-foreground text-xs">{description}</p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
