import { BaseQueryDto, BaseQuerySchema } from 'src/common/dto/base-query.dto';
import z from 'zod';

export const QuerySubjectsSchema = BaseQuerySchema.extend({
  topicId: z.coerce.number().int().positive().optional(),
});

export class QuerySubjectsDto extends BaseQueryDto {
  static schema = QuerySubjectsSchema;

  topicId?: number;
}
