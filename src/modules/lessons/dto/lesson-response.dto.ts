import { ContentType } from '@prisma/client';

export interface LessonResponseDto {
  id: number;
  sectionId: number;
  title: string;
  contentType: ContentType;
  contentUrl: string | null;
  contentText: string | null;
  durationMinutes: number;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
