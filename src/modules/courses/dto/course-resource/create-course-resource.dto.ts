import z from 'zod';

export const CreateCourseResourceSchema = z.object({
  resource_type: z
    .string()
    .min(1, 'Resource type is required')
    .max(100, 'Resource type is too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
});

export class CreateCourseResourceDto {
  static schema = CreateCourseResourceSchema;

  resource_type: string;
  name: string;
}
