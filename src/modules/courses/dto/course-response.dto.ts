import { ContentType, CourseStatus } from '@prisma/client';

interface TopicDto {
  id: number;
  name: string;
}

interface SubjectDto {
  id: number;
  name: string;
  topic: TopicDto;
}

interface MentorProfileDto {
  bio: string | null;
  avatar: string | null;
  expertise: string | null;
}

interface MentorDto {
  id: number;
  name: string;
  email: string;
  profile: MentorProfileDto | null;
}

interface CourseImageDto {
  id: number;
  imagePath: string | null;
  orderIndex: number;
}

interface CourseKeyPointDto {
  id: number;
  keyPoint: string;
}

interface CoursePersonaDto {
  id: number;
  persona: string;
}

interface CourseResourceDto {
  id: number;
  resourceType: string;
  resourcePath: string;
  fileName: string;
  fileSize: number;
}

interface LessonDto {
  id: number;
  title: string;
  contentType: ContentType;
  contentUrl: string | null;
  contentText: string | null;
  durationMinutes: number;
  orderIndex: number;
  isActive: boolean;
}

interface CourseSectionDto {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
  totalLessons: number;
  lessons: LessonDto[];
}

interface StudentProfileDto {
  avatar: string | null;
}

interface ReviewStudentDto {
  id: number;
  name: string;
  profile: StudentProfileDto | null;
}

interface CourseReviewDto {
  id: number;
  rating: number;
  reviewText: string | null;
  createdAt: Date;
  student: ReviewStudentDto;
}

export interface CourseResponseDto {
  id: number;
  title: string;
  description: string | null;
  about: string | null;
  tools: string | null;
  price: number;
  enrollmentToken: string | null;
  status: CourseStatus;
  totalLessons: number;
  totalStudents: number;
  createdAt: Date;
  updatedAt: Date;
  subject: SubjectDto;
  mentor: MentorDto;
  images: CourseImageDto[];
  keyPoints: CourseKeyPointDto[];
  personas: CoursePersonaDto[];
  resources: CourseResourceDto[];
  sections: CourseSectionDto[];
  reviews: CourseReviewDto[];
}

export interface CourseWithEnrollmentDto extends CourseResponseDto {
  isEnrolled: boolean;
}
