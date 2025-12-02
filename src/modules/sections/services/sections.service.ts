import { Injectable, NotFoundException } from '@nestjs/common';
import { SectionsRepository } from '../repositories/sections.repository';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { SectionResponseDto } from '../dto/section-response.dto';
import { CreateSectionDto } from '../dto/create-section.dto';

@Injectable()
export class SectionsService {
  constructor(private readonly sectionsRepository: SectionsRepository) {}

  async findAll(): Promise<BaseResponse<SectionResponseDto[]>> {
    const sections = await this.sectionsRepository.findMany();
    const sectionResponse = this.sectionsRepository.toResponseDtos(sections);
    return {
      message: 'Sections retrieved successfully',
      data: sectionResponse,
    };
  }

  async findByCourseId(
    courseId: number,
  ): Promise<BaseResponse<SectionResponseDto[]>> {
    const sections = await this.sectionsRepository.findByCourseId(courseId);
    const sectionResponse = this.sectionsRepository.toResponseDtos(sections);
    return {
      message: 'Sections retrieved successfully',
      data: sectionResponse,
    };
  }

  async findById(id: number): Promise<BaseResponse<SectionResponseDto | null>> {
    const section = await this.sectionsRepository.findByIdWithCourse(id);

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return {
      message: 'Section retrieved successfully',
      data: this.sectionsRepository.toResponseDto(section),
    };
  }

  async create(
    createSectionDto: CreateSectionDto,
  ): Promise<BaseResponse<SectionResponseDto>> {
    const section = await this.sectionsRepository.create(createSectionDto);
    const sectionWithCourse = await this.sectionsRepository.findByIdWithCourse(
      section.id,
    );

    if (!sectionWithCourse) {
      throw new NotFoundException('Section not found after creation');
    }

    return {
      message: 'Section created successfully',
      data: this.sectionsRepository.toResponseDto(sectionWithCourse),
    };
  }

  async update(
    id: number,
    updateSectionDto: Partial<CreateSectionDto>,
  ): Promise<BaseResponse<SectionResponseDto>> {
    const existingSection =
      await this.sectionsRepository.findByIdWithCourse(id);
    if (!existingSection) {
      throw new NotFoundException('Section not found');
    }

    const section = await this.sectionsRepository.update(id, updateSectionDto);
    const sectionWithCourse = await this.sectionsRepository.findByIdWithCourse(
      section.id,
    );

    if (!sectionWithCourse) {
      throw new NotFoundException('Section not found after update');
    }

    return {
      message: 'Section updated successfully',
      data: this.sectionsRepository.toResponseDto(sectionWithCourse),
    };
  }

  async delete(id: number): Promise<BaseResponse<null>> {
    const existingSection =
      await this.sectionsRepository.findByIdWithCourse(id);
    if (!existingSection) {
      throw new NotFoundException('Section not found');
    }

    await this.sectionsRepository.delete(id);

    return {
      message: 'Section deleted successfully',
      data: null,
    };
  }
}
