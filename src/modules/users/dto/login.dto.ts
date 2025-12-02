import z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password is required'),
});

export class LoginDto {
  static schema = LoginSchema;
  email: string;
  password: string;
}
