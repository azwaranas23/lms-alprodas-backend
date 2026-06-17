import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

export class ForgotPasswordDto {
  static schema = ForgotPasswordSchema;

  email: string;
}
