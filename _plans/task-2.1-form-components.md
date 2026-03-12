# Task 2.1: Form Components

## Mô tả

Tạo các form component tái sử dụng với React Hook Form và validation

## 1. Base Form Components

### src/components/ui/Input.tsx

```typescript
import React, { forwardRef } from 'react'
import { cn } from '@utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

### src/components/ui/Select.tsx

```typescript
import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@utils/cn'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
              error && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
```

### src/components/ui/Textarea.tsx

```typescript
import React, { forwardRef } from 'react'
import { cn } from '@utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
```

### src/components/ui/Checkbox.tsx

```typescript
import React, { forwardRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@utils/cn'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
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
                'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
                error && 'border-red-500',
                className
              )}
              ref={ref}
              {...props}
            />
            <Check className="absolute top-0 left-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
          </div>
          {(label || description) && (
            <div className="grid gap-1.5 leading-none">
              {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {label}
                </label>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
```

## 2. Advanced Form Components

### src/components/forms/SearchInput.tsx

```typescript
import React, { useState, useCallback, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@components/ui/Input'
import { useDebounce } from '@hooks/useDebounce'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  className
}) => {
  const [inputValue, setInputValue] = useState(value)
  const debouncedValue = useDebounce(inputValue, debounceMs)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange?.(debouncedValue)
      onSearch?.(debouncedValue)
    }
  }, [debouncedValue, onChange, onSearch, value])

  const handleClear = useCallback(() => {
    setInputValue('')
    onChange?.('')
    onSearch?.('')
  }, [onChange, onSearch])

  return (
    <Input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
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
  )
}
```

### src/components/forms/MultiSelect.tsx

```typescript
import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@utils/cn'

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
  error?: string
  className?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const removeOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue))
  }

  const selectedOptions = options.filter(option => value.includes(option.value))

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            'flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer',
            error && 'border-red-500',
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-2 py-1 rounded text-xs"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOption(option.value)
                    }}
                    className="hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isOpen && 'transform rotate-180'
          )} />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted',
                  option.disabled && 'opacity-50 cursor-not-allowed'
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
  )
}
```

## 3. Form Validation Schema

### src/utils/validation.ts

```typescript
import { z } from "zod";

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters");
export const usernameSchema = z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens",
    );

// Auth schemas
export const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
    .object({
        username: usernameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

// Problem schemas
export const problemSearchSchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    types: z.array(z.string()).optional(),
    pointStart: z.number().optional(),
    pointEnd: z.number().optional(),
    fullText: z.boolean().optional(),
    hideSolved: z.boolean().optional(),
    showTypes: z.boolean().optional(),
    hasPublicEditorial: z.boolean().optional(),
});

// Contest schemas
export const contestJoinSchema = z.object({
    accessCode: z.string().optional(),
});

// User profile schemas
export const profileUpdateSchema = z.object({
    displayName: z.string().min(1, "Display name is required").max(50),
    bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    location: z
        .string()
        .max(100, "Location must be at most 100 characters")
        .optional(),
    organization: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProblemSearchData = z.infer<typeof problemSearchSchema>;
export type ContestJoinData = z.infer<typeof contestJoinSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
```

## 4. Form Hooks

### src/hooks/useForm.ts

```typescript
import {
    useForm as useHookForm,
    UseFormProps,
    FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface UseFormOptions<T extends FieldValues> extends Omit<
    UseFormProps<T>,
    "resolver"
> {
    schema?: z.ZodSchema<T>;
}

export function useForm<T extends FieldValues>(
    options: UseFormOptions<T> = {},
) {
    const { schema, ...formOptions } = options;

    return useHookForm<T>({
        ...formOptions,
        resolver: schema ? zodResolver(schema) : undefined,
    });
}
```

### src/hooks/useDebounce.ts

```typescript
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
```

## 5. File Upload Component

### src/components/forms/FileUpload.tsx

```typescript
import React, { useCallback, useState } from 'react'
import { Upload, X, File } from 'lucide-react'
import { cn } from '@utils/cn'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  onFilesChange?: (files: File[]) => void
  label?: string
  error?: string
  className?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFilesChange,
  label,
  error,
  className
}) => {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return

    const fileArray = Array.from(newFiles)
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large`)
        return false
      }
      return true
    })

    const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }, [files, multiple, maxSize, onFilesChange])

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }, [files, onFilesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          error && 'border-red-500',
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-primary-600 hover:text-primary-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {accept ? `Accepted formats: ${accept}` : 'Any file type'}
              {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`}
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
```

## Checklist

- [ ] Create base Input component with validation
- [ ] Implement Select component with custom styling
- [ ] Add Textarea component with error handling
- [ ] Create Checkbox component with proper accessibility
- [ ] Build SearchInput with debouncing
- [ ] Implement MultiSelect with dropdown
- [ ] Setup validation schemas with Zod
- [ ] Create custom form hooks
- [ ] Add FileUpload component with drag & drop
- [ ] Test all form components
- [ ] Verify accessibility compliance
- [ ] Add proper TypeScript types
