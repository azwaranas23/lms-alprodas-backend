import { CourseStatus } from '@prisma/client';

export interface MyCourseResponseDto {
  id: number;
  title: string;
  description: string | null;
  price: number;
  status: CourseStatus;
  totalLessons: number;
  progressPercentage: number;
  enrolledAt: Date;
  image: string | null;
  certificateId: string | null;
  mentor: {
    id: number;
    name: string;
    avatar: string | null;
    expertise: string | null;
  };
  subject: {
    id: number;
    name: string;
    topic: {
      id: number;
      name: string;
    };
  };
}
