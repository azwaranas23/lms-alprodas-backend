import { CourseResource } from '@prisma/client';

export type UpdateCourseResourceData = Partial<
  Pick<
    CourseResource,
    'resourceType' | 'fileName' | 'resourcePath' | 'fileSize'
  >
>;
