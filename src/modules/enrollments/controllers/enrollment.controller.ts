/* eslint-disable prettier/prettier */
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { EnrollWithTokenResponseDto } from '../dto/enrollment-response.dto';
import { EnrollWithTokenDto } from '../dto/enroll-with-token';
import { EnrollmentService } from '../services/enrollment.service';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post('token')
  @UseGuards(PermissionsGuard)
  @Permissions('courses.enroll')
  async enrollWithToken(
    @CurrentUser() user: UsersResponseDto,
    @Body() body: EnrollWithTokenDto,
  ): Promise<BaseResponse<EnrollWithTokenResponseDto>> {
    return this.enrollmentService.enrollWithToken(user, body);
  }
}
