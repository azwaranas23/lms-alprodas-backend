import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UsersResponseDto } from '../dto/users-response.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { QueryUsersDto } from '../dto/query-users.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { UsersListResponseDto } from '../dto/users-list-response.dto';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private validateManager(user: UsersResponseDto): void {
    if (user.role.key !== UserRole.MANAGER) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('mentors')
  @Permissions('mentors.read')
  async getMentors(
    @CurrentUser() user: UsersResponseDto,
    @Query() query: QueryUsersDto,
  ): Promise<BaseResponse<PaginatedResponse<UsersListResponseDto>>> {
    this.validateManager(user);
    const mentors = await this.usersService.getUsersByRole(
      UserRole.MENTOR,
      query,
    );
    return {
      message: 'Mentors retrieved successfully',
      data: mentors,
    };
  }

  @Get('students')
  @Permissions('students.read')
  async getStudents(
    @CurrentUser() user: UsersResponseDto,
    @Query() query: QueryUsersDto,
  ): Promise<BaseResponse<PaginatedResponse<UsersListResponseDto>>> {
    this.validateManager(user);
    const students = await this.usersService.getUsersByRole(
      UserRole.STUDENT,
      query,
    );
    return {
      message: 'Students retrieved successfully',
      data: students,
    };
  }
}
