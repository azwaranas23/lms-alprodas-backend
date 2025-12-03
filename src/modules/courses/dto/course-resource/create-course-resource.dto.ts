import z from 'zod';

export const CreateCourseResourceSchema = z.object({
  resource_type: z.string().max(100, 'Resource type is too long').optional(),
  name: z.string().max(255, 'Name is too long').optional(),
});

export class CreateCourseResourceDto {
  static schema = CreateCourseResourceSchema;

  resource_type?: string;
  name?: string;
}
