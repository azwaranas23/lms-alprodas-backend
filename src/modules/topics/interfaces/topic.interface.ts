import { Topic } from '@prisma/client';

export interface TopicWithCourseCount extends Topic {
  courseCount: number;
  subjectCount: number;
  studentEnrollmentCount: number;
}
