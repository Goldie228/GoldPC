/**
 * Утилита для runtime-валидации ответов API через Zod
 * В Development — логирует ошибки валидации
 * В Production — пропускает данные (доверяем серверу)
 */
import { z } from 'zod';

export function validateResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.error('[API Validation Error]', result.error.format());
    }
  }
  return data as T;
}
