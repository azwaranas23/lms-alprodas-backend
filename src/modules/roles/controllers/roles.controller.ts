import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesService } from '../services/roles.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { RoleResponseDto } from '../dto/roles-response.dto';
import { UpdateRolePermissionsDto } from '../dto/update-role-permissions.dto';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles.read')
  async findAll(): Promise<BaseResponse<RoleResponseDto[]>> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permissions('roles.read')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<RoleResponseDto>> {
    return this.rolesService.findById(id);
  }

  @Put(':id/permissions')
  @Permissions('roles.update')
  async updateRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRolePermissionsDto,
  ): Promise<BaseResponse<RoleResponseDto>> {
    return this.rolesService.updateRolePermissions(id, updateDto);
  }
}
