import { CourseSection, Course, Lesson } from '@prisma/client';

export type SectionWithCourse = CourseSection & {
  course: Course;
  lessons: Lesson[];
};
