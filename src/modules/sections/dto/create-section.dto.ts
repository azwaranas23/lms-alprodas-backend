import { z } from 'zod';

export const CreateSectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional(),
  course_id: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
    .refine(
      (val) => !Number.isNaN(val) && val > 0,
      'Course ID must be a positive integer',
    ),
  order_index: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
    .refine(
      (val) => !Number.isNaN(val) && val >= 0,
      'Order index must be a non-negative integer',
    ),
});

export class CreateSectionDto {
  static readonly schema = CreateSectionSchema;

  title: string;
  description?: string;
  course_id: number;
  order_index: number;
}
