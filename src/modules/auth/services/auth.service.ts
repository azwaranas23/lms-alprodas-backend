import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/services/users.service';
import { JwtTokenService } from './jwt.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { LoginDto } from 'src/modules/users/dto/login.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { AuthResponseDto } from '../dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { User } from '@prisma/client';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { RegisterDto } from 'src/modules/users/dto/register.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import {
  CreateUserData,
  CreateUserProfileData,
} from 'src/modules/users/types/users.types';

import * as crypto from 'crypto';
import { QueueService } from 'src/common/services/queue.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async login(loginDto: LoginDto): Promise<BaseResponse<AuthResponseDto>> {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User is not verified');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...userWithoutPassword } = user;

    const userDto =
      this.usersService.transformToDtoWithoutPassword(userWithoutPassword);

    const userWithStats = await this.addUserStatistics(userDto);

    const accessToken = this.jwtTokenService.generateToken(userDto);

    return {
      message: 'Login successful',
      data: {
        accessToken,
        user: userWithStats,
      },
    };
  }

  private async addUserStatistics(userDto: any): Promise<any> {
    const stats = { ...userDto };

    if (userDto.role.key === UserRole.MENTOR) {
      // Get total courses count for mentor
      const totalCourses = await this.prisma.course.count({
        where: { mentorId: userDto.id },
      });

      // Get total students from all mentor's courses
      const totalStudentsResult = await this.prisma.course.aggregate({
        where: { mentorId: userDto.id },
        _sum: { totalStudents: true },
      });

      stats.totalCourses = totalCourses;
      stats.totalStudents = totalStudentsResult._sum.totalStudents || 0;
      stats.totalEnrolledCourses = null;
    } else if (userDto.role.key === UserRole.STUDENT) {
      // Get total enrolled courses for student
      const totalEnrolledCourses = await this.prisma.enrollment.count({
        where: { studentId: userDto.id },
      });

      stats.totalCourses = null;
      stats.totalStudents = null;
      stats.totalEnrolledCourses = totalEnrolledCourses;
    } else {
      // For other roles (like MANAGER), set all to null
      stats.totalCourses = null;
      stats.totalStudents = null;
      stats.totalEnrolledCourses = null;
    }

    return stats;
  }

  async validateUser(userId: number): Promise<UsersResponseDto | null> {
    const user = await this.usersService.findById(userId);
    return user;
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<BaseResponse<RegisterResponseDto>> {
    const isEmailTaken = await this.usersService.isEmailTaken(
      registerDto.email,
    );
    if (isEmailTaken) {
      throw new ConflictException('Email is already taken');
    }

    const role = await this.prisma.role.findUnique({
      where: { key: registerDto.role },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const userData: CreateUserData = {
      email: registerDto.email,
      password: hashedPassword,
      roleId: role.id,
      name: registerDto.name,
      phone: registerDto.phone,
      isVerified: false,
      verificationToken,
    };

    const profileData: CreateUserProfileData = {
      gender: registerDto.gender,
      avatar: registerDto.avatar,
      bio: registerDto.bio,
      expertise: registerDto.expertise,
      experienceYears: registerDto.experienceYears,
      linkedinUrl: registerDto.linkedinUrl,
      githubUrl: registerDto.githubUrl,
    };

    const user = await this.usersService.register(userData, profileData);

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.queueService.addEmailJob({
      to: user.email,
      subject: 'Verifikasi Email - LMS Alprodas',
      template: 'verification',
      templateData: {
        name: user.name,
        email: user.email,
        verificationUrl,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      message: 'Registration successful',
      data: {
        user,
      },
    };
  }

  async verifyEmail(token: string): Promise<BaseResponse<null>> {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    if (user.isVerified) {
      return {
        message: 'Email is already verified',
        data: null,
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return {
      message: 'Email verified successfully',
      data: null,
    };
  }

  async resendVerificationEmail(email: string): Promise<BaseResponse<null>> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return {
        message: 'Email is already verified',
        data: null,
      };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await this.queueService.addEmailJob({
      to: user.email,
      subject: 'Verifikasi Email - LMS Alprodas',
      template: 'verification',
      templateData: {
        name: user.name,
        email: user.email,
        verificationUrl,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      message: 'Verification email resent successfully',
      data: null,
    };
  }
}
