import { CourseStatus } from '@prisma/client';
import { BaseQueryDto, BaseQuerySchema } from 'src/common/dto/base-query.dto';
import z from 'zod';

export const QueryCourseSchema = BaseQuerySchema.extend({
  status: z.enum([CourseStatus.DRAFT, CourseStatus.PUBLISHED]).optional(),
  subjectId: z.coerce.number().int().positive().optional(),
  topicId: z.coerce.number().int().positive().optional(),
});

export class QueryCourseDto extends BaseQueryDto {
  static schema = QueryCourseSchema;

  status?: CourseStatus;
  subjectId?: number;
  topicId?: number;
}
