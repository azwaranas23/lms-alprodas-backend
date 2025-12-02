import { ContentType } from '@prisma/client';

export interface LessonWithProgress {
  id: number;
  title: string;
  contentType: ContentType;
  contentUrl: string | null;
  contentText: string | null;
  durationMinutes: number;
  orderIndex: number;
  isActive: boolean;
  progress: {
    isCompleted: boolean;
    completedAt: Date | null;
  };
}

export interface SectionWithLessonsProgress {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
  totalLessons: number;
  lessons: LessonWithProgress[];
}

export interface CourseWithProgressData {
  id: number;
  title: string;
  description: string | null;
  totalLessons: number;
  subject: {
    id: number;
    name: string;
    topic: {
      id: number;
      name: string;
    };
  };
  mentor: {
    id: number;
    name: string;
    avatar: string | null;
  };
  image: string | null;
  sections: SectionWithLessonsProgress[];
}
