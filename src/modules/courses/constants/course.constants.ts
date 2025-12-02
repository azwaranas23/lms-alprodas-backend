/**
 * Course image order indices
 */
export const COURSE_IMAGE_ORDER = {
  MAIN: 1,
  PREVIEW: 2,
  SAMPLE: 3,
  CERTIFICATE: 4,
} as const;

/**
 * Course image type mappings
 */
export type CourseImageType = 'main' | 'preview' | 'sample' | 'certificate';

export const COURSE_IMAGE_TYPE_TO_ORDER: Record<CourseImageType, number> = {
  main: COURSE_IMAGE_ORDER.MAIN,
  preview: COURSE_IMAGE_ORDER.PREVIEW,
  sample: COURSE_IMAGE_ORDER.SAMPLE,
  certificate: COURSE_IMAGE_ORDER.CERTIFICATE,
};

/**
 * Default values for course queries
 */
export const COURSE_DEFAULT_LIMIT = 3;
