import React, { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, debounceMs);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange?.(debouncedValue);
      onSearch?.(debouncedValue);
    }
  }, [debouncedValue, onChange, onSearch, value]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange?.('');
    onSearch?.('');
  }, [onChange, onSearch]);

  return (
    <Input
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      placeholder={placeholder}
      leftIcon={<Search className="h-4 w-4" />}
      rightIcon={
        inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )
      }
      className={className}
    />
  );
};
