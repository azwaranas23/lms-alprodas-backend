import { Module } from '@nestjs/common';
import { CoursesService } from './services/courses.service';
import { CoursesController } from './controllers/courses.controller';
import { AuthModule } from '../auth/auth.module';
import { CoursesRepository } from './repositories/courses.repository';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { CoursesResourceController } from './controllers/courses-resource.controller';
import { CoursesResourceService } from './services/courses-resource.service';
import { FrontCoursesController } from './controllers/front-courses.controller';
import { EnrollmentService } from '../enrollments/services/enrollment.service';
import { EnrollmentRepository } from '../enrollments/repositories/enrollment.repository';
import { CourseLearningController } from './controllers/course-learning.controller';
import { CourseLearningService } from './services/course-learning.service';
import { CoursesLearningRepository } from './repositories/courses-learning.repository';
import { LessonsRepository } from '../lessons/repositories/lessons.repository';
import { StudentCourseResourcesController } from './controllers/student-course-resources.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    CoursesController,
    CoursesResourceController,
    FrontCoursesController,
    CourseLearningController,
    StudentCourseResourcesController,
  ],
  providers: [
    CoursesService,
    CoursesRepository,
    FileUploadService,
    CoursesResourceService,
    EnrollmentService,
    EnrollmentRepository,
    CourseLearningService,
    EnrollmentRepository,
    CoursesLearningRepository,
    LessonsRepository,
  ],
})
export class CourseModule {}
