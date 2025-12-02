import z from 'zod';

export const CheckBalanceSchema = z.object({
  amount: z.number().positive().min(100000, 'Amount must be at least 100000'),
});

export class CheckBalanceDto {
  static schema = CheckBalanceSchema;

  amount: number;
}
