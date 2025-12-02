import { Injectable } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  toResponseDto(permission: Permission) {
    return {
      id: permission.id,
      name: permission.name,
      key: permission.key,
      resource: permission.resource,
    };
  }

  toResponseDtos(permissions: Permission[]) {
    return permissions.map((permission) => this.toResponseDto(permission));
  }
}
