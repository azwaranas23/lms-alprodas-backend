import { z } from 'zod';

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export class VerifyEmailDto {
  static readonly schema = VerifyEmailSchema;

  token: string;
}
