import { WithdrawalStatus } from '@prisma/client';
import z from 'zod';

export const UpdateWithdrawalStatusSchema = z.object({
  status: z.nativeEnum(WithdrawalStatus),
  proof_payment_withdrawal: z.string().optional().nullable(),
});

export class UpdateWithdrawalStatusDto {
  static schema = UpdateWithdrawalStatusSchema;

  status: WithdrawalStatus;
  proof_payment_withdrawal?: string | null;
}
