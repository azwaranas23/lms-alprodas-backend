import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { TopicsRepository } from '../repositories/topics.repository';
import { NotFoundException } from '@nestjs/common';
import { Topic } from '@prisma/client';
import { TopicWithCourseCount } from '../interfaces/topic.interface';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { QueryTopicsDto } from '../dto/query-topics.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';

describe('TopicsService', () => {
  let service: TopicsService;
  let repository: TopicsRepository;

  const mockTopic: Topic = {
    id: 1,
    name: 'Mathematics',
    description: 'Math topic',
    image: 'http://example.com/math.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTopicWithCounts: TopicWithCourseCount = {
    ...mockTopic,
    courseCount: 5,
    subjectCount: 3,
    studentEnrollmentCount: 10,
  };

  const mockTopicResponseDto: any = {
    id: 1,
    name: 'Mathematics',
    description: 'Math topic',
    image: 'http://example.com/math.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    courseCount: 5,
    subjectCount: 3,
    studentEnrollmentCount: 10,
  };

  const mockRepository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findByIdWithCourseCount: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toResponseDto: jest.fn(),
    toResponseDtos: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        {
          provide: TopicsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
    repository = module.get<TopicsRepository>(TopicsRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated topics with BaseResponse wrapper', async () => {
      const query: QueryTopicsDto = { page: 1, limit: 10 };
      const repositoryResult = {
        topics: [mockTopicWithCounts],
        total: 1,
        page: 1,
        limit: 10,
      };

      const paginatedData = PaginationUtil.createResponse(
        [mockTopicResponseDto],
        1,
        10,
        1,
      );

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([mockTopicResponseDto]);

      const result = await service.findAll(query);

      expect(result).toEqual({
        message: 'Topics retrieved successfully',
        data: paginatedData,
      });
      expect(mockRepository.findMany).toHaveBeenCalledWith(query);
      expect(mockRepository.toResponseDtos).toHaveBeenCalledWith([
        mockTopicWithCounts,
      ]);
    });

    it('should handle search query parameter', async () => {
      const query: QueryTopicsDto = { page: 1, limit: 10, search: 'Math' };
      const repositoryResult = {
        topics: [mockTopicWithCounts],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([mockTopicResponseDto]);

      await service.findAll(query);

      expect(mockRepository.findMany).toHaveBeenCalledWith(query);
    });

    it('should return empty paginated result when no topics found', async () => {
      const query: QueryTopicsDto = { page: 1, limit: 10 };
      const repositoryResult = {
        topics: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      const paginatedData = PaginationUtil.createResponse([], 1, 10, 0);

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([]);

      const result = await service.findAll(query);

      expect(result).toEqual({
        message: 'Topics retrieved successfully',
        data: paginatedData,
      });
    });

    it('should handle custom page and limit values', async () => {
      const query: QueryTopicsDto = { page: 3, limit: 20 };
      const repositoryResult = {
        topics: [mockTopicWithCounts],
        total: 50,
        page: 3,
        limit: 20,
      };

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([mockTopicResponseDto]);

      const result = await service.findAll(query);

      expect((result.data as any)?.meta.page).toBe(3);
      expect((result.data as any)?.meta.limit).toBe(20);
    });
  });

  describe('findById', () => {
    it('should return topic with BaseResponse wrapper when found', async () => {
      mockRepository.findByIdWithCourseCount.mockResolvedValue(
        mockTopicWithCounts,
      );
      mockRepository.toResponseDto.mockReturnValue(mockTopicResponseDto);

      const result = await service.findById(1);

      expect(result).toEqual({
        message: 'Topic retrieved successfully',
        data: mockTopicResponseDto,
      });
      expect(mockRepository.findByIdWithCourseCount).toHaveBeenCalledWith(1);
      expect(mockRepository.toResponseDto).toHaveBeenCalledWith(
        mockTopicWithCounts,
      );
    });

    it('should throw NotFoundException when topic not found', async () => {
      mockRepository.findByIdWithCourseCount.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow('Topic not found');
    });

    it('should return topic with zero counts', async () => {
      const topicWithZeroCounts: TopicWithCourseCount = {
        ...mockTopic,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      };

      const responseDto = {
        ...mockTopicResponseDto,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      };

      mockRepository.findByIdWithCourseCount.mockResolvedValue(
        topicWithZeroCounts,
      );
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.findById(1);

      expect((result?.data as any)?.courseCount).toBe(0);
      expect((result?.data as any)?.subjectCount).toBe(0);
      expect((result?.data as any)?.studentEnrollmentCount).toBe(0);
    });
  });

  describe('create', () => {
    it('should create topic and return BaseResponse with default counts', async () => {
      const createDto: CreateTopicDto = {
        name: 'Physics',
        description: 'Physics topic',
        image: 'http://example.com/physics.jpg',
      };

      const createdTopic: Topic = {
        id: 2,
        name: createDto.name,
        description: createDto.description ?? null,
        image: createDto.image ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const topicWithZeroCounts = {
        ...createdTopic,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      };

      const responseDto = {
        ...createdTopic,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      };

      mockRepository.create.mockResolvedValue(createdTopic);
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.create(createDto);

      expect(result).toEqual({
        message: 'Topic created successfully',
        data: responseDto,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.toResponseDto).toHaveBeenCalledWith(
        topicWithZeroCounts,
      );
    });

    it('should create topic with null optional fields', async () => {
      const createDto: CreateTopicDto = {
        name: 'Biology',
        description: null,
        image: null,
      };

      const createdTopic: Topic = {
        id: 3,
        name: 'Biology',
        description: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const responseDto = {
        ...createdTopic,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      };

      mockRepository.create.mockResolvedValue(createdTopic);
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.create(createDto);

      expect(result.data?.description).toBeNull();
      expect(result.data?.image).toBeNull();
    });

    it('should set all counts to 0 for newly created topic', async () => {
      const createDto: CreateTopicDto = {
        name: 'Chemistry',
      };

      const createdTopic: Topic = {
        id: 4,
        name: 'Chemistry',
        description: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const responseDto = {
        ...createdTopic,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      };

      mockRepository.create.mockResolvedValue(createdTopic);
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.create(createDto);

      expect((result.data as any)?.courseCount).toBe(0);
      expect((result.data as any)?.subjectCount).toBe(0);
      expect((result.data as any)?.studentEnrollmentCount).toBe(0);
    });
  });

  describe('update', () => {
    it('should update topic and return BaseResponse', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Advanced Mathematics',
        description: 'Updated description',
      };

      const updatedTopic: Topic = {
        ...mockTopic,
        ...updateDto,
        updatedAt: new Date('2024-01-02'),
      };

      const updatedTopicWithCounts: TopicWithCourseCount = {
        ...updatedTopic,
        courseCount: 5,
        subjectCount: 3,
        studentEnrollmentCount: 10,
      };

      const responseDto = {
        ...updatedTopicWithCounts,
      };

      mockRepository.findById.mockResolvedValue(mockTopic);
      mockRepository.update.mockResolvedValue(updatedTopic);
      mockRepository.findByIdWithCourseCount.mockResolvedValue(
        updatedTopicWithCounts,
      );
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.update(1, updateDto);

      expect(result).toEqual({
        message: 'Topic updated successfully',
        data: responseDto,
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(mockRepository.findByIdWithCourseCount).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when topic does not exist', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Updated Name',
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateDto)).rejects.toThrow(
        'Topic not found',
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.findByIdWithCourseCount).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when topic not found after update', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Updated Name',
      };

      mockRepository.findById.mockResolvedValue(mockTopic);
      mockRepository.update.mockResolvedValue(mockTopic);
      mockRepository.findByIdWithCourseCount.mockResolvedValue(null);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Topic not found after update',
      );
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Updated Name',
      };

      const updatedTopic: Topic = {
        ...mockTopic,
        name: 'Updated Name',
      };

      const updatedTopicWithCounts: TopicWithCourseCount = {
        ...updatedTopic,
        courseCount: 5,
        subjectCount: 3,
        studentEnrollmentCount: 10,
      };

      mockRepository.findById.mockResolvedValue(mockTopic);
      mockRepository.update.mockResolvedValue(updatedTopic);
      mockRepository.findByIdWithCourseCount.mockResolvedValue(
        updatedTopicWithCounts,
      );
      mockRepository.toResponseDto.mockReturnValue({
        ...updatedTopicWithCounts,
      });

      const result = await service.update(1, updateDto);

      expect(result.data?.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete topic and return BaseResponse with null data', async () => {
      mockRepository.findById.mockResolvedValue(mockTopic);
      mockRepository.delete.mockResolvedValue(mockTopic);

      const result = await service.delete(1);

      expect(result).toEqual({
        message: 'Topic deleted successfully',
        data: null,
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when topic does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      await expect(service.delete(999)).rejects.toThrow('Topic not found');

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should verify topic exists before deletion', async () => {
      mockRepository.findById.mockResolvedValue(mockTopic);
      mockRepository.delete.mockResolvedValue(mockTopic);

      await service.delete(1);

      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalled();
    });
  });
});
