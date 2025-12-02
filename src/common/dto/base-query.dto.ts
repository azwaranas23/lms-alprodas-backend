import { z } from 'zod';

export const BaseQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Limit must be greater than 0'),
  search: z.string().optional(),
});

export class BaseQueryDto {
  static schema = BaseQuerySchema;

  page: number;
  limit: number;
  search?: string;
}
