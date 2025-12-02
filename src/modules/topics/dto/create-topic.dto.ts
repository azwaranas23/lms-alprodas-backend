import z from 'zod';

export const CreateTopicSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters long')
    .max(255, 'Name must be at most 255 characters long'),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export class CreateTopicDto {
  static schema = CreateTopicSchema;

  name: string;
  description?: string | null;
  image?: string | null;
}
