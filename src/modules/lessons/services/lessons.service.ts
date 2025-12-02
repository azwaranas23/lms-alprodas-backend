import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonsRepository } from '../repositories/lessons.repository';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { LessonResponseDto } from '../dto/lesson-response.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly lessonsRepository: LessonsRepository) {}

  async findAll(): Promise<BaseResponse<LessonResponseDto[]>> {
    const lessons = await this.lessonsRepository.findMany();
    const lessonResponse = this.lessonsRepository.toResponseDtos(lessons);
    return {
      message: 'Lessons retrieved successfully',
      data: lessonResponse,
    };
  }

  async findBySectionId(
    sectionId: number,
  ): Promise<BaseResponse<LessonResponseDto[]>> {
    const lessons = await this.lessonsRepository.findBySectionId(sectionId);
    const lessonResponse = this.lessonsRepository.toResponseDtos(lessons);
    return {
      message: 'Lessons retrieved successfully',
      data: lessonResponse,
    };
  }

  async findById(id: number): Promise<BaseResponse<LessonResponseDto | null>> {
    const lesson = await this.lessonsRepository.findByIdWithSection(id);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const lessonResponse = this.lessonsRepository.toResponseDto(lesson);
    return {
      message: 'Lesson retrieved successfully',
      data: lessonResponse,
    };
  }

  async create(
    createLessonDto: CreateLessonDto,
  ): Promise<BaseResponse<LessonResponseDto>> {
    const lesson = await this.lessonsRepository.create(createLessonDto);

    const lessonWithSection = await this.lessonsRepository.findByIdWithSection(
      lesson.id,
    );

    if (!lessonWithSection) {
      throw new NotFoundException('Lesson not found after creation');
    }

    const lessonResponse =
      this.lessonsRepository.toResponseDto(lessonWithSection);

    return {
      message: 'Lesson created successfully',
      data: lessonResponse,
    };
  }

  async update(
    id: number,
    updateLessonDto: UpdateLessonDto,
  ): Promise<BaseResponse<LessonResponseDto>> {
    const existingLesson = await this.lessonsRepository.findById(id);

    if (!existingLesson) {
      throw new NotFoundException('Lesson not found');
    }

    const updatedLesson = await this.lessonsRepository.update(
      id,
      updateLessonDto,
    );

    const lessonWithSection = await this.lessonsRepository.findByIdWithSection(
      updatedLesson.id,
    );

    if (!lessonWithSection) {
      throw new NotFoundException('Lesson not found after update');
    }

    const lessonResponse =
      this.lessonsRepository.toResponseDto(lessonWithSection);
    return {
      message: 'Lesson updated successfully',
      data: lessonResponse,
    };
  }

  async delete(id: number): Promise<BaseResponse<null>> {
    const existingLesson = await this.lessonsRepository.findById(id);

    if (!existingLesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.lessonsRepository.delete(id, existingLesson.sectionId);

    return {
      message: 'Lesson deleted successfully',
      data: null,
    };
  }
}
