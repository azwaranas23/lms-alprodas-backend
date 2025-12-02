import { CourseSection, Lesson } from '@prisma/client';

export type LessonWithSection = Lesson & {
  section: CourseSection;
};
