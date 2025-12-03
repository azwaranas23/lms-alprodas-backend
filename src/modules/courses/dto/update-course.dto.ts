import { z } from 'zod';
import { CourseStatus } from '@prisma/client';

export const UpdateCourseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .optional(),
  description: z.string().optional(),
  about: z.string().optional(),
  tools: z
    .string()
    .optional()
    .describe('Comma-separated list of tools used in the course'),
  key_points: z
    .array(z.string().min(1, 'Key point cannot be empty'))
    .optional()
    .describe('Array of key points for the course'),
  personas: z
    .array(z.string().min(1, 'Persona cannot be empty'))
    .optional()
    .describe('Array of target personas for the course'),
  price: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine(
      (val) => !isNaN(val) && val >= 0,
      'Price must be a non-negative number',
    )
    .optional(),
  status: z
    .enum([CourseStatus.DRAFT, CourseStatus.PUBLISHED, CourseStatus.ARCHIVED])
    .optional(),
  subject_id: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .refine(
      (val) => !isNaN(val) && val > 0,
      'Subject ID must be a positive integer',
    )
    .optional(),
  course_token: z.string().optional(), // ⬅️ baru
});

export class UpdateCourseDto {
  static schema = UpdateCourseSchema;

  title?: string;
  description?: string;
  about?: string;
  tools?: string;
  key_points?: string[];
  personas?: string[];
  price?: number;
  status?: CourseStatus;
  subject_id?: number;
  course_token?: string; // ⬅️ baru
}
