import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { DashboardService } from '../services/dashboard.service';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';
import { LatestTransactionData } from '../interfaces/dashboard.interface';
import {
  LatestCourseDto,
  LatestTransactionDto,
  LatestUserDto,
} from '../dto/latest-data-response.dto';

@Controller('dashboard')
@UseGuards(PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @Permissions('dashboard.read')
  async getStatistics(
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<DashboardResponseDto>> {
    const stats = await this.dashboardService.getStatistics(
      user.id,
      user.role.key,
    );
    return {
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('latest-transactions')
  @Permissions('dashboard.read')
  async getLatestTransactions(
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<LatestTransactionDto[]>> {
    const transactions = await this.dashboardService.getLatestTransactions(
      user.id,
      user.role.key,
    );
    return {
      message: 'Latest transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get('latest-courses')
  @Permissions('dashboard.read')
  async getLatestCourses(
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<LatestCourseDto[]>> {
    const courses = await this.dashboardService.getLatestCourses(
      user.id,
      user.role.key,
    );
    return {
      message: 'Latest courses retrieved successfully',
      data: courses,
    };
  }

  @Get('latest-users')
  @Permissions('dashboard.read')
  async getLatestUsers(
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<LatestUserDto[]>> {
    const users = await this.dashboardService.getLatestUsers(user.role.key);
    return {
      message: 'Latest users retrieved successfully',
      data: users,
    };
  }
}
