import z from 'zod';

export const UpdateCourseResourceSchema = z.object({
  resource_type: z.string().max(100, 'Resource type is too long').optional(),

  name: z.string().max(255, 'Name is too long').optional(),
});

export class UpdateCourseResourceDto {
  static schema = UpdateCourseResourceSchema;

  resource_type?: string;
  name?: string;
}
