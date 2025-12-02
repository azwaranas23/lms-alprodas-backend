import z from 'zod';

export const UpdateCourseResourceSchema = z.object({
  resource_type: z
    .string()
    .min(1, 'Resource type is required')
    .max(100, 'Resource type is too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
});

export class UpdateCourseResourceDto {
  static schema = UpdateCourseResourceSchema;

  resource_type: string;
  name: string;
}
