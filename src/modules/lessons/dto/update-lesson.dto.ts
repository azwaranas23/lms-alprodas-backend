import { ContentType } from '@prisma/client';
import z from 'zod';

export const UpdateLessonSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title is too long')
      .optional(),
    content_type: z
      .nativeEnum(ContentType, {
        message: 'Content type must be VIDEO, Or ARTICLE',
      })
      .optional(),
    content_url: z.string().optional().nullable(),
    content_text: z.string().optional().nullable(),
    duration_minutes: z
      .number()
      .min(1, 'Duration must be at least 1 minute')
      .optional(),
    order_index: z
      .number()
      .int()
      .min(1, 'Order index must be a positive integer')
      .optional(),
    is_active: z.boolean().default(true).optional(),
  })
  .refine(
    (data) => {
      if (
        data.content_type === ContentType.VIDEO &&
        data.content_url === undefined
      ) {
        return false;
      }
      if (
        data.content_type === ContentType.ARTICLE &&
        data.content_text === undefined
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'content_url is required for VIDEO type, content_text is required for ARTICLE type',
      path: ['content_validation'],
    },
  );

export class UpdateLessonDto {
  static schema = UpdateLessonSchema;

  title: string;
  content_type: ContentType;
  content_url?: string | null;
  content_text?: string | null;
  duration_minutes: number;
  order_index: number;
  is_active?: boolean;
}
