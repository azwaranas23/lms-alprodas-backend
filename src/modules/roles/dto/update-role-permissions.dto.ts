import { z } from 'zod';

export const UpdateRolePermissionsSchema = z.object({
  permission_ids: z.array(z.number().int().positive(), {
    message: 'Permission IDs must be an array of positive integers',
  }),
});

export class UpdateRolePermissionsDto {
  static schema = UpdateRolePermissionsSchema;

  permission_ids: number[];
}
