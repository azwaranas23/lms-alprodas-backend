import { z } from 'zod';

export const UpdateSectionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .optional(),
  description: z.string().optional(),
  order_index: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .refine(
      (val) => !isNaN(val) && val >= 0,
      'Order index must be a non-negative integer',
    )
    .optional(),
});

export class UpdateSectionDto {
  static schema = UpdateSectionSchema;

  title?: string;
  description?: string;
  order_index?: number;
}
