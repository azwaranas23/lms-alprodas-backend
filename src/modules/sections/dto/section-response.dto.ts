interface SectionCourseDto {
  id: number;
  title: string;
  description: string | null;
}

interface SectionLessonDto {
  id: number;
  title: string;
  contentType: string;
  contentUrl: string | null;
  durationMinutes: number;
  orderIndex: number;
  isActive: boolean;
}

export interface SectionResponseDto {
  id: number;
  title: string;
  description: string | null;
  courseId: number;
  course: SectionCourseDto;
  orderIndex: number;
  totalLessons: number;
  lessons: SectionLessonDto[];
}
