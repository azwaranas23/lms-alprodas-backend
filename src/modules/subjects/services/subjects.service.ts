import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubjectsRepository } from '../repositories/subjects.repository';
import { QuerySubjectsDto } from '../dto/query-subjects.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { SubjectsResponseDto } from '../dto/subjects-response.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly subjectsRepository: SubjectsRepository) {}

  async findAll(
    query: QuerySubjectsDto,
  ): Promise<BaseResponse<PaginatedResponse<SubjectsResponseDto>>> {
    const result = await this.subjectsRepository.findMany(query);

    const { subjects, total, page, limit } = result;

    const subjectsResponse = this.subjectsRepository.toResponseDtos(subjects);

    const paginatedData = PaginationUtil.createResponse(
      subjectsResponse,
      page,
      limit,
      total,
    );

    return {
      message: 'Subjects retrieved successfully',
      data: paginatedData,
    };
  }

  async findById(id: number): Promise<BaseResponse<SubjectsResponseDto>> {
    const subject = await this.subjectsRepository.findByIdWithTopic(id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return {
      message: 'Subject retrieved successfully',
      data: this.subjectsRepository.toResponseDto(subject),
    };
  }

  async create(
    createSubjectDto: CreateSubjectDto,
  ): Promise<BaseResponse<SubjectsResponseDto>> {
    const subject = await this.subjectsRepository.create(createSubjectDto);

    const subjectWithTopic = await this.subjectsRepository.findByIdWithTopic(
      subject.id,
    );

    if (!subjectWithTopic) {
      throw new NotFoundException('Subject not found after creation');
    }

    const subjectResponse =
      this.subjectsRepository.toResponseDto(subjectWithTopic);

    return {
      message: 'Subject created successfully',
      data: subjectResponse,
    };
  }

  async update(
    id: number,
    data: UpdateSubjectDto,
  ): Promise<BaseResponse<SubjectsResponseDto>> {
    const existingSubject = await this.subjectsRepository.findById(id);

    if (!existingSubject) {
      throw new NotFoundException('Subject not found');
    }

    await this.subjectsRepository.update(id, data);

    const updatedSubject = await this.subjectsRepository.findByIdWithTopic(id);

    if (!updatedSubject) {
      throw new NotFoundException('Subject not found after update');
    }

    const subjectResponse =
      this.subjectsRepository.toResponseDto(updatedSubject);

    return {
      message: 'Subject updated successfully',
      data: subjectResponse,
    };
  }

  async delete(id: number): Promise<BaseResponse<null>> {
    const existingSubject = await this.subjectsRepository.findById(id);

    if (!existingSubject) {
      throw new NotFoundException('Subject not found');
    }

    await this.subjectsRepository.delete(id);

    return { message: 'Subject deleted successfully', data: null };
  }
}
