import {
  useForm as useHookForm,
  type UseFormProps,
  type FieldValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface UseFormOptions<T extends FieldValues> extends Omit<
  UseFormProps<T>,
  'resolver'
> {
  schema?: z.ZodSchema<T>;
}

export function useForm<T extends FieldValues>(
  options: UseFormOptions<T> = {}
) {
  const { schema, ...formOptions } = options;

  return useHookForm<T>({
    ...formOptions,
    resolver: schema ? zodResolver(schema) : undefined,
  });
}
