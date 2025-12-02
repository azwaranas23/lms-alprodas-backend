import z from 'zod';

export const ValidatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export class ValidatePasswordDto {
  static schema = ValidatePasswordSchema;

  password: string;
}
