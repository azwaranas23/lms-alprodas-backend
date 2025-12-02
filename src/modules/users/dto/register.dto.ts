import { z } from 'zod';
import { Gender } from '@prisma/client';
import {
  VALIDATION_REGEX,
  VALIDATION_MESSAGES,
} from '../../../common/constants/validation.constants';
import {
  UserRole,
  REGISTRATION_ROLES,
} from '../../../common/enums/user-role.enum';

export const RegisterSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(VALIDATION_REGEX.PASSWORD, VALIDATION_MESSAGES.PASSWORD),
    confirmPassword: z.string(),
    role: z.enum(REGISTRATION_ROLES),
    phone: z
      .string()
      .regex(
        VALIDATION_REGEX.INDONESIAN_PHONE,
        VALIDATION_MESSAGES.INDONESIAN_PHONE,
      )
      .optional(),
    gender: z.nativeEnum(Gender).optional(),
    avatar: z.string().optional(),
    bio: z.string().max(500, 'Bio is too long').optional(),
    expertise: z.string().max(255, 'Expertise is too long').optional(),
    experienceYears: z.number().min(0).max(50).optional(),
    linkedInUrl: z
      .string()
      .url({ message: 'Invalid LinkedIn URL' })
      .max(255)
      .optional()
      .or(z.literal('')),
    githubUrl: z
      .string()
      .url({ message: 'Invalid GitHub URL' })
      .max(255)
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export class RegisterDto {
  static schema = RegisterSchema;

  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
  gender?: Gender;
  avatar?: string;
  bio?: string;
  expertise?: string;
  experienceYears?: number;
  linkedinUrl?: string;
  githubUrl?: string;
}
