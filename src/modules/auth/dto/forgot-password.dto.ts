import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export class ForgotPasswordDto {
  static readonly schema = ForgotPasswordSchema;

  email: string;
}
