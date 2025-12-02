import { Role } from '@prisma/client';

export type RoleWithPermissions = Role & {
  rolePermissions: {
    permission: {
      id: number;
      name: string;
      key: string;
      resource: string;
    };
  }[];
};
