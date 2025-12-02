import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RoleWithPermissions } from '../types/roles.types';

@Injectable()
export class RolesRepository {
  private readonly rolesInclude = {
    rolePermissions: {
      include: {
        permission: true,
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      include: this.rolesInclude,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: number): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: this.rolesInclude,
    });
  }

  async validatePermissionIds(permissionIds: number[]): Promise<number[]> {
    if (permissionIds.length === 0) return [];

    const foundPermissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
      select: {
        id: true,
      },
    });

    const foundIds = new Set(foundPermissions.map((p) => p.id));
    return permissionIds.filter((id) => !foundIds.has(id));
  }

  async updateRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<RoleWithPermissions> {
    return this.prisma.$transaction(async (prisma) => {
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        const rolePermissionsData = permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        }));

        await prisma.rolePermission.createMany({
          data: rolePermissionsData,
        });
      }

      return prisma.role.findUniqueOrThrow({
        where: { id: roleId },
        include: this.rolesInclude,
      });
    });
  }

  toResponseDto(role: RoleWithPermissions) {
    return {
      id: role.id,
      name: role.name,
      key: role.key,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        key: rp.permission.key,
        resource: rp.permission.resource,
      })),
    };
  }

  toResponseDtos(roles: RoleWithPermissions[]) {
    return roles.map((role) => this.toResponseDto(role));
  }
}
