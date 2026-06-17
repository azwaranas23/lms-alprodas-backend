import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Token cannot be empty' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export class ResetPasswordDto {
  static schema = ResetPasswordSchema;

  token: string;
  password: string;
}
