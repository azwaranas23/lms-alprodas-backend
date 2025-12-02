import { BaseQueryDto, BaseQuerySchema } from 'src/common/dto/base-query.dto';

export const QueryTopicsSchema = BaseQuerySchema;

export class QueryTopicsDto extends BaseQueryDto {
  static schema = QueryTopicsSchema;
}
