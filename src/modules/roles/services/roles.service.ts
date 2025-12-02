import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolesRepository } from '../repositories/roles.repository';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { RoleResponseDto } from '../dto/roles-response.dto';
import { UpdateRolePermissionsDto } from '../dto/update-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAll(): Promise<BaseResponse<RoleResponseDto[]>> {
    const roles = await this.rolesRepository.findAll();
    const data = this.rolesRepository.toResponseDtos(roles);
    return {
      message: 'Roles retrieved successfully',
      data,
    };
  }

  async findById(id: number): Promise<BaseResponse<RoleResponseDto>> {
    const role = await this.rolesRepository.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const data = this.rolesRepository.toResponseDto(role);
    return {
      message: 'Role retrieved successfully',
      data,
    };
  }

  async updateRolePermissions(
    roleId: number,
    updateDto: UpdateRolePermissionsDto,
  ): Promise<BaseResponse<RoleResponseDto>> {
    const role = await this.rolesRepository.findById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (updateDto.permission_ids.length === 0) {
      throw new BadRequestException('No permission IDs provided');
    }

    const invalidPermissionIds =
      await this.rolesRepository.validatePermissionIds(
        updateDto.permission_ids,
      );

    if (invalidPermissionIds.length > 0) {
      throw new NotFoundException(
        `Invalid permission IDs: ${invalidPermissionIds.join(', ')}`,
      );
    }

    const updatedRole = await this.rolesRepository.updateRolePermissions(
      roleId,
      updateDto.permission_ids,
    );
    const data = this.rolesRepository.toResponseDto(updatedRole);
    return {
      message: 'Role permissions updated successfully',
      data,
    };
  }
}
