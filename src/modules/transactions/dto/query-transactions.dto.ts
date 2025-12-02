import { BaseQueryDto, BaseQuerySchema } from 'src/common/dto/base-query.dto';

export const QueryTransactionsSchema = BaseQuerySchema;

export class QueryTransactionsDto extends BaseQueryDto {
  static schema = QueryTransactionsSchema;
}
