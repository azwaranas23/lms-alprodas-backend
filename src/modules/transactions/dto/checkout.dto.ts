import z from 'zod';

export const CheckoutSchema = z.object({
  course_id: z.number().int().positive('Course ID must be a positive integer'),
  test_expiry_seconds: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'For testing: transaction will expire after this many seconds instead of 24 hours',
    ),
});

export class CheckoutDto {
  static schema = CheckoutSchema;

  course_id: number;
  test_expiry_seconds?: number;
}
