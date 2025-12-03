/* eslint-disable prettier/prettier */
import z from 'zod';

export const EnrollWithTokenSchema = z.object({
  course_id: z.number().int().positive('Course ID must be a positive integer'),
  token: z.string().min(1, 'Course token is required'),
});

export class EnrollWithTokenDto {
  static schema = EnrollWithTokenSchema;

  course_id: number;
  token: string;
}
