import z from 'zod';

export const LoginSchema = z.object({
  email: z.email({ error: 'Invalid email format' }),
  password: z.string().min(8, 'Password is required'),
});

export class LoginDto {
  static readonly schema = LoginSchema;
  email: string;
  password: string;
}
