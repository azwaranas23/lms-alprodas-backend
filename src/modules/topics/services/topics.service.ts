import { Injectable, NotFoundException } from '@nestjs/common';
import { TopicsRepository } from '../repositories/topics.repository';
import { QueryTopicsDto } from '../dto/query-topics.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { TopicResponseDto } from '../dto/topic-response.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly topicsRepository: TopicsRepository) {}

  async findAll(
    query: QueryTopicsDto,
  ): Promise<BaseResponse<PaginatedResponse<TopicResponseDto>>> {
    const result = await this.topicsRepository.findMany(query);

    const { topics, total, page, limit } = result;

    const topicsResponse = this.topicsRepository.toResponseDtos(topics);
    const paginatedData = PaginationUtil.createResponse(
      topicsResponse,
      page,
      limit,
      total,
    );

    return {
      message: 'Topics retrieved successfully',
      data: paginatedData,
    };
  }

  async findById(id: number): Promise<BaseResponse<TopicResponseDto>> {
    const topic = await this.topicsRepository.findByIdWithCourseCount(id);

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const topicDto = this.topicsRepository.toResponseDto(topic);

    return {
      message: 'Topic retrieved successfully',
      data: topicDto,
    };
  }

  async create(
    createTopicDto: CreateTopicDto,
  ): Promise<BaseResponse<TopicResponseDto>> {
    const topic = await this.topicsRepository.create(createTopicDto);
    const topicWithCount = {
      ...topic,
      courseCount: 0,
      subjectCount: 0,
      studentEnrollmentCount: 0,
    };

    const topicDto = this.topicsRepository.toResponseDto(topicWithCount);

    return {
      message: 'Topic created successfully',
      data: topicDto,
    };
  }

  async update(
    id: number,
    updateTopicDto: UpdateTopicDto,
  ): Promise<BaseResponse<TopicResponseDto>> {
    const existingTopic = await this.topicsRepository.findById(id);

    if (!existingTopic) {
      throw new NotFoundException('Topic not found');
    }

    await this.topicsRepository.update(id, updateTopicDto);

    const topicWithCount =
      await this.topicsRepository.findByIdWithCourseCount(id);

    if (!topicWithCount) {
      throw new NotFoundException('Topic not found after update');
    }

    const topicDto = this.topicsRepository.toResponseDto(topicWithCount);

    return {
      message: 'Topic updated successfully',
      data: topicDto,
    };
  }

  async delete(id: number): Promise<BaseResponse<null>> {
    const existingTopic = await this.topicsRepository.findById(id);

    if (!existingTopic) {
      throw new NotFoundException('Topic not found');
    }

    await this.topicsRepository.delete(id);

    return {
      message: 'Topic deleted successfully',
      data: null,
    };
  }
}
