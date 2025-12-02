export class TopicSummaryDto {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
}

export class SubjectsResponseDto {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  topicId: number;
  topic: TopicSummaryDto;
  totalCourses: number;
  totalStudents?: number;
}
