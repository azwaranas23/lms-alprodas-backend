import { WithdrawalStatus } from '@prisma/client';
import { BaseQueryDto, BaseQuerySchema } from 'src/common/dto/base-query.dto';
import z from 'zod';

export const QueryWithdrawalsSchema = BaseQuerySchema.extend({
  status: z.nativeEnum(WithdrawalStatus).optional(),
});

export class QueryWithdrawalsDto extends BaseQueryDto {
  static schema = QueryWithdrawalsSchema;

  status?: WithdrawalStatus;
}
