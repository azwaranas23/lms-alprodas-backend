import { ForbiddenException, Injectable } from '@nestjs/common';
import { DashboardRepository } from '../repositories/dashboard.repository';
import {
  DashboardStatistics,
  LatestTransactionData,
  TransactionWithCourseAndStudent,
} from '../interfaces/dashboard.interface';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  LatestCourseDto,
  LatestTransactionDto,
  LatestUserDto,
} from '../dto/latest-data-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStatistics(
    userId: number,
    userRole: string,
  ): Promise<DashboardStatistics> {
    if (userRole === UserRole.MENTOR) {
      return this.dashboardRepository.getMentorStatistics(userId);
    } else if (userRole === UserRole.MANAGER) {
      return this.dashboardRepository.getAdminStatistics();
    }
    throw new ForbiddenException('Access denied');
  }

  async getLatestTransactions(
    userId: number,
    userRole: string,
  ): Promise<LatestTransactionDto[]> {
    if (userRole === UserRole.MENTOR) {
      return this.dashboardRepository.findLatestTransaction(5, userId);
    } else if (userRole === UserRole.MANAGER) {
      return this.dashboardRepository.findLatestTransaction(5);
    }
    throw new ForbiddenException('Access denied');
  }

  async getLatestCourses(
    userId: number,
    userRole: string,
  ): Promise<LatestCourseDto[]> {
    if (userRole === UserRole.MANAGER) {
      return this.dashboardRepository.findLatestCourses(5);
    } else if (userRole === UserRole.MENTOR) {
      return this.dashboardRepository.findLatestCourses(5, userId);
    }
    throw new ForbiddenException('Access denied');
  }

  async getLatestUsers(userRole: string): Promise<LatestUserDto[]> {
    if (userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    return this.dashboardRepository.findLatestUsers(5);
  }
}
