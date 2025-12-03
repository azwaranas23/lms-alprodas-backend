import { z } from 'zod';
import { CourseStatus } from '@prisma/client';

export const CreateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional(),
  about: z.string().optional(),
  tools: z
    .string()
    .optional()
    .describe('Comma-separated list of tools used in the course'),
  key_points: z
    .array(z.string().min(1, 'Key point cannot be empty'))
    .min(4, 'Must have exactly 4 key points')
    .max(4, 'Must have exactly 4 key points')
    .describe('Array of key points for the course (must be exactly 4)'),
  personas: z
    .array(z.string().min(1, 'Persona cannot be empty'))
    .min(4, 'Must have exactly 4 personas')
    .max(4, 'Must have exactly 4 personas')
    .describe('Array of target personas for the course (must be exactly 4)'),
  price: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine(
      (val) => !isNaN(val) && val >= 0,
      'Price must be a non-negative number',
    )
    .default(0),
  status: z
    .enum([CourseStatus.PUBLISHED, CourseStatus.DRAFT])
    .optional()
    .default(CourseStatus.DRAFT)
    .describe('Course status - PUBLISHED or DRAFT'),
  subject_id: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .refine(
      (val) => !isNaN(val) && val > 0,
      'Subject ID must be a positive integer',
    ),
  mentor_id: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .refine(
      (val) => !isNaN(val) && val > 0,
      'Mentor ID must be a positive integer',
    ),
  course_token: z.string().min(1, 'Class token is required'),
});

export class CreateCourseDto {
  static schema = CreateCourseSchema;

  title: string;
  description?: string;
  about?: string;
  tools?: string;
  key_points: string[];
  personas: string[];
  price: number;
  status?: CourseStatus;
  subject_id: number;
  mentor_id: number;
  course_token: string;
}
