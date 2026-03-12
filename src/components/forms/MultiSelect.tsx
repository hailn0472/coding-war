import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/utils';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option =>
    value.includes(option.value)
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none">{label}</label>
      )}
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            'border-input bg-background ring-offset-background focus-within:ring-ring flex min-h-[40px] w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2',
            error && 'border-red-500',
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 rounded bg-primary-100 px-2 py-1 text-xs text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removeOption(option.value);
                    }}
                    className="hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180 transform'
            )}
          />
        </div>

        {isOpen && (
          <div className="border-input bg-background absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-lg">
            {options.map(option => (
              <div
                key={option.value}
                className={cn(
                  'hover:bg-muted flex cursor-pointer items-center justify-between px-3 py-2',
                  option.disabled && 'cursor-not-allowed opacity-50'
                )}
                onClick={() => !option.disabled && toggleOption(option.value)}
              >
                <span>{option.label}</span>
                {value.includes(option.value) && (
                  <Check className="h-4 w-4 text-primary-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
