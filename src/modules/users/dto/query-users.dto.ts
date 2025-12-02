import { BaseQueryDto, BaseQuerySchema } from 'src/common/dto/base-query.dto';

export const QueryUsersSchema = BaseQuerySchema;

export class QueryUsersDto extends BaseQueryDto {
  static schema = QueryUsersSchema;
}
