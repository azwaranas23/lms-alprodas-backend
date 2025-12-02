export interface TopicResponseDto {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
