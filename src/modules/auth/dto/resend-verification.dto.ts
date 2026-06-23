import { z } from 'zod';

export const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export class ResendVerificationDto {
  static readonly schema = ResendVerificationSchema;

  email: string;
}
