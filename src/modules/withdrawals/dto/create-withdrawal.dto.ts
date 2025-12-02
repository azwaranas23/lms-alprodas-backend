import z from 'zod';

export const CreateWithdrawalSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(100000, 'Minimum withdrawal amount is Rp 100,000'),
  bank_name: z
    .string()
    .min(1, 'Bank name is required')
    .max(100, 'Bank name is too long'),
  account_number: z
    .string()
    .min(1, 'Account number is required')
    .max(50, 'Account number is too long')
    .regex(/^[0-9]+$/, 'Account number must contain only numbers'),
  account_holder_name: z
    .string()
    .min(1, 'Account holder name is required')
    .max(255, 'Account holder name is too long'),
});

export class CreateWithdrawalDto {
  static schema = CreateWithdrawalSchema;

  password: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
}
