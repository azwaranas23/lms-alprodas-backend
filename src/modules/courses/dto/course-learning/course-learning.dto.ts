import { ContentType } from '@prisma/client';

export interface CourseWithProgressResponseDto {
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
  sections: {
    id: number;
    title: string;
    description: string | null;
    orderIndex: number;
    totalLessons: number;
    lessons: {
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
    }[];
  }[];
  progressStats: {
    totalLessons: number;
    completedLessons: number;
    percentage: number;
  };
}

export interface CourseProgressResponseDto {
  courseId: number;
  progressStats: {
    totalLessons: number;
    completedLessons: number;
    percentage: number;
  };
  lessons: {
    id: number;
    isCompleted: boolean;
    completedAt: Date | null;
    lesson: {
      id: number;
      title: string;
      orderIndex: number;
      sectionId: number;
    };
  }[];
}

export interface LessonDetailResponseDto {
  id: number;
  title: string;
  contentType: ContentType;
  contentUrl: string | null;
  contentText: string | null;
  durationMinutes: number;
  orderIndex: number;
  isActive: boolean;
  section: {
    id: number;
    title: string;
    courseId: number;
  };
  progress: {
    isCompleted: boolean;
    completedAt: Date | null;
  };
  navigation: {
    previousLesson: {
      id: number;
      title: string;
    } | null;
    nextLesson: {
      id: number;
      title: string;
    } | null;
  };
}

export interface LessonCompleteResponseDto {
  currentLesson: {
    id: number;
    title: string;
    isCompleted: boolean;
  };
  nextLesson: {
    id: number;
    title: string;
  } | null;
  courseProgress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
}
