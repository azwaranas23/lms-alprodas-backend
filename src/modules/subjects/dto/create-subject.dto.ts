import { z } from 'zod';

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().optional(),
  image: z.string().optional(),
  topic_id: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .refine(
      (val) => !isNaN(val) && val > 0,
      'Topic ID must be a positive integer',
    ),
});

export class CreateSubjectDto {
  static schema = CreateSubjectSchema;

  name: string;
  description?: string;
  image?: string;
  topic_id: number;
}
