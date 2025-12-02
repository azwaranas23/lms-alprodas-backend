import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';
import { PermissionsService } from '../services/permissions.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PermissionResponseDto } from '../dto/permission-response.dto';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll(): Promise<BaseResponse<PermissionResponseDto[]>> {
    return this.permissionsService.findAll();
  }
}
