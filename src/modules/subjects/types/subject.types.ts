import { Subject, Topic } from '@prisma/client';

export type SubjectWithTopic = Subject & {
  topic: Topic;
  totalStudents?: number;
};
