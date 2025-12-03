// src/modules/enrollments/enrollment.module.ts
import { Module } from '@nestjs/common';
import { EnrollmentController } from './controllers/enrollment.controller';
import { EnrollmentService } from './services/enrollment.service';
import { CoursesRepository } from 'src/modules/courses/repositories/courses.repository';
import { AuthModule } from 'src/modules/auth/auth.module';
import { EnrollmentRepository } from './repositories/enrollment.repository';

@Module({
  imports: [AuthModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService, EnrollmentRepository, CoursesRepository],
  exports: [EnrollmentService, EnrollmentRepository],
})
export class EnrollmentModule {}
