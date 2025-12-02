export const VALIDATION_REGEX = {
  INDONESIAN_PHONE: /^(\+62|62|0)8[1-9][0-9]{6,9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

export const VALIDATION_MESSAGES = {
  INDONESIAN_PHONE: 'Invalid Indonesian phone number',
  PASSWORD:
    'Password must contain at least one uppercase letter, one lowercase letter, and one number',
} as const;
