import { CreateSubjectSchema } from './create-subject.dto';

export const UpdateSubjectSchema = CreateSubjectSchema.partial();

export class UpdateSubjectDto {
  static readonly schema = UpdateSubjectSchema;

  name?: string;
  description?: string;
  image?: string;
  topic_id?: number;
}
