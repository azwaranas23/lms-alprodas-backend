import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreateUserData,
  CreateUserProfileData,
  UserWithRoleAndPermissions,
} from '../types/users.types';
import { UsersResponseDto } from '../dto/users-response.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { QueryUsersDto } from '../dto/query-users.dto';
import { Prisma, User } from '@prisma/client';
import { UsersListResponseDto } from '../dto/users-list-response.dto';

interface PaginatedUsersResponse {
  users: UserWithRoleAndPermissions[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class UsersRepository {
  private readonly usersInclude = {
    role: {
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    },
    userProfile: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithRoleAndPermissions | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.usersInclude,
    });
  }

  toResponseDto(user: UserWithRoleAndPermissions): UsersResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: null, // phone sudah tidak ada di schema
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: {
        id: user.role.id,
        name: user.role.name,
        key: user.role.key,
        permissions: user.role.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          key: rp.permission.key,
          resource: rp.permission.resource,
        })),
      },
      userProfile: user.userProfile
        ? {
            id: user.userProfile.id,
            bio: user.userProfile.bio,
            avatar: user.userProfile.avatar,
            gender: user.userProfile.gender,
          }
        : null,
    };
  }

  async findById(id: number): Promise<UserWithRoleAndPermissions | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.usersInclude,
    });
  }

  async createUserWithProfile(
    userData: CreateUserData,
    profileData?: CreateUserProfileData,
  ): Promise<UserWithRoleAndPermissions> {
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        userProfile: profileData ? { create: profileData } : undefined,
      },
      include: this.usersInclude,
    });
    return user as UserWithRoleAndPermissions;
  }

  async findByRole(
    role: UserRole,
    query: QueryUsersDto,
  ): Promise<PaginatedUsersResponse> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: {
        key: role,
      },
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: this.usersInclude,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async toListResponseDto(
    user: UserWithRoleAndPermissions,
  ): Promise<UsersListResponseDto> {
    const baseDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      isActive: user.isActive,
      phone: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roleName: user.role.name,
      userProfile: user.userProfile
        ? {
            id: user.userProfile.id,
            bio: user.userProfile.bio,
            avatar: user.userProfile.avatar,
            gender: user.userProfile.gender,
          }
        : null,
      enrolledCoursesCount: null,
      createdCoursesCount: null,
      totalRevenue: null,
    };

    if (user.role.key === UserRole.STUDENT) {
      const enrolledCoursesCount = await this.prisma.enrollment.count({
        where: { studentId: user.id },
      });
      return { ...baseDto, enrolledCoursesCount };
    }

    if (user.role.key === UserRole.MENTOR) {
      const createdCoursesCount = await this.prisma.course.count({
        where: { mentorId: user.id },
      });

      return {
        ...baseDto,
        createdCoursesCount,
        totalRevenue: 0, // transaksi sudah dihapus
      };
    }

    return baseDto;
  }

  async findByIdWithPassword(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
