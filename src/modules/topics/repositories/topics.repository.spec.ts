import { Test, TestingModule } from '@nestjs/testing';
import { TopicsRepository } from './topics.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Topic } from '@prisma/client';
import { TopicWithCourseCount } from '../interfaces/topic.interface';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';

describe('TopicsRepository', () => {
  let repository: TopicsRepository;
  let prisma: PrismaService;

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

  const mockPrismaService = {
    topic: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subject: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    course: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      groupBy: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<TopicsRepository>(TopicsRepository);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findMany', () => {
    it('should return paginated topics with counts', async () => {
      const query = { page: 1, limit: 10, search: undefined };
      const topics = [mockTopic];

      mockPrismaService.topic.findMany.mockResolvedValue(topics);
      mockPrismaService.topic.count.mockResolvedValue(1);
      mockPrismaService.subject.findMany.mockResolvedValue([
        { id: 1, topicId: 1 },
        { id: 2, topicId: 1 },
        { id: 3, topicId: 1 },
      ]);
      mockPrismaService.course.groupBy.mockResolvedValue([
        { subjectId: 1, _count: { _all: 2 } },
        { subjectId: 2, _count: { _all: 3 } },
      ]);
      mockPrismaService.enrollment.groupBy.mockResolvedValue([
        { courseId: 1, _count: { _all: 5 } },
        { courseId: 2, _count: { _all: 5 } },
      ]);
      mockPrismaService.course.findMany.mockResolvedValue([
        { id: 1, subjectId: 1 },
        { id: 2, subjectId: 2 },
      ]);

      const result = await repository.findMany(query);

      expect(result).toEqual({
        topics: [
          {
            ...mockTopic,
            courseCount: 5,
            subjectCount: 3,
            studentEnrollmentCount: 10,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      });

      expect(mockPrismaService.topic.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.topic.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should apply search filter with case-insensitive matching', async () => {
      const query = { page: 1, limit: 10, search: 'Math' };

      mockPrismaService.topic.findMany.mockResolvedValue([]);
      mockPrismaService.topic.count.mockResolvedValue(0);
      mockPrismaService.subject.findMany.mockResolvedValue([]);

      await repository.findMany(query);

      expect(mockPrismaService.topic.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'Math', mode: 'insensitive' } },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should calculate correct skip value for pagination', async () => {
      const query = { page: 3, limit: 20, search: undefined };

      mockPrismaService.topic.findMany.mockResolvedValue([]);
      mockPrismaService.topic.count.mockResolvedValue(0);
      mockPrismaService.subject.findMany.mockResolvedValue([]);

      await repository.findMany(query);

      expect(mockPrismaService.topic.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 40, // (3 - 1) * 20
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle topics with no subjects or courses', async () => {
      const query = { page: 1, limit: 10, search: undefined };
      const topics = [mockTopic];

      mockPrismaService.topic.findMany.mockResolvedValue(topics);
      mockPrismaService.topic.count.mockResolvedValue(1);
      mockPrismaService.subject.findMany.mockResolvedValue([]);

      const result = await repository.findMany(query);

      expect(result.topics[0]).toEqual({
        ...mockTopic,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      });
    });

    it('should aggregate counts correctly across multiple topics', async () => {
      const query = { page: 1, limit: 10, search: undefined };
      const topic1: Topic = { ...mockTopic, id: 1, name: 'Math' };
      const topic2: Topic = { ...mockTopic, id: 2, name: 'Science' };

      mockPrismaService.topic.findMany.mockResolvedValue([topic1, topic2]);
      mockPrismaService.topic.count.mockResolvedValue(2);
      mockPrismaService.subject.findMany.mockResolvedValue([
        { id: 1, topicId: 1 },
        { id: 2, topicId: 1 },
        { id: 3, topicId: 2 },
      ]);
      mockPrismaService.course.groupBy.mockResolvedValue([
        { subjectId: 1, _count: { _all: 3 } },
        { subjectId: 2, _count: { _all: 2 } },
        { subjectId: 3, _count: { _all: 4 } },
      ]);
      mockPrismaService.enrollment.groupBy.mockResolvedValue([
        { courseId: 1, _count: { _all: 5 } },
        { courseId: 2, _count: { _all: 3 } },
      ]);
      mockPrismaService.course.findMany.mockResolvedValue([
        { id: 1, subjectId: 1 },
        { id: 2, subjectId: 3 },
      ]);

      const result = await repository.findMany(query);

      expect(result.topics).toHaveLength(2);
      expect(result.topics[0]).toMatchObject({
        id: 1,
        courseCount: 5, // 3 + 2 from subjects 1 and 2
        subjectCount: 2,
        studentEnrollmentCount: 5,
      });
      expect(result.topics[1]).toMatchObject({
        id: 2,
        courseCount: 4,
        subjectCount: 1,
        studentEnrollmentCount: 3,
      });
    });
  });

  describe('findByIdWithCourseCount', () => {
    it('should return topic with aggregated counts', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue(mockTopic);
      mockPrismaService.course.count.mockResolvedValue(5);
      mockPrismaService.subject.count.mockResolvedValue(3);
      mockPrismaService.enrollment.count.mockResolvedValue(10);

      const result = await repository.findByIdWithCourseCount(1);

      expect(result).toEqual(mockTopicWithCounts);
      expect(mockPrismaService.topic.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.course.count).toHaveBeenCalledWith({
        where: { subject: { topicId: 1 } },
      });
      expect(mockPrismaService.subject.count).toHaveBeenCalledWith({
        where: { topicId: 1 },
      });
      expect(mockPrismaService.enrollment.count).toHaveBeenCalledWith({
        where: { course: { subject: { topicId: 1 } } },
      });
    });

    it('should return null when topic not found', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue(null);
      mockPrismaService.course.count.mockResolvedValue(0);
      mockPrismaService.subject.count.mockResolvedValue(0);
      mockPrismaService.enrollment.count.mockResolvedValue(0);

      const result = await repository.findByIdWithCourseCount(999);

      expect(result).toBeNull();
    });

    it('should handle topic with zero counts', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue(mockTopic);
      mockPrismaService.course.count.mockResolvedValue(0);
      mockPrismaService.subject.count.mockResolvedValue(0);
      mockPrismaService.enrollment.count.mockResolvedValue(0);

      const result = await repository.findByIdWithCourseCount(1);

      expect(result).toEqual({
        ...mockTopic,
        courseCount: 0,
        subjectCount: 0,
        studentEnrollmentCount: 0,
      });
    });
  });

  describe('findById', () => {
    it('should return topic by id', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue(mockTopic);

      const result = await repository.findById(1);

      expect(result).toEqual(mockTopic);
      expect(mockPrismaService.topic.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when topic not found', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new topic', async () => {
      const createDto: CreateTopicDto = {
        name: 'Physics',
        description: 'Physics topic',
        image: 'http://example.com/physics.jpg',
      };

      const newTopic: Topic = {
        id: 2,
        name: createDto.name,
        description: createDto.description ?? null,
        image: createDto.image ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.topic.create.mockResolvedValue(newTopic);

      const result = await repository.create(createDto);

      expect(result).toEqual(newTopic);
      expect(mockPrismaService.topic.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should create topic with optional fields as null', async () => {
      const createDto: CreateTopicDto = {
        name: 'Biology',
        description: null,
        image: null,
      };

      const newTopic: Topic = {
        id: 3,
        name: 'Biology',
        description: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.topic.create.mockResolvedValue(newTopic);

      const result = await repository.create(createDto);

      expect(result).toEqual(newTopic);
    });
  });

  describe('update', () => {
    it('should update an existing topic', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Advanced Mathematics',
        description: 'Updated description',
        image: 'http://example.com/new-math.jpg',
      };

      const updatedTopic: Topic = {
        id: 1,
        name: updateDto.name,
        description: updateDto.description ?? null,
        image: updateDto.image ?? null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.topic.update.mockResolvedValue(updatedTopic);

      const result = await repository.update(1, updateDto);

      expect(result).toEqual(updatedTopic);
      expect(mockPrismaService.topic.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('should update topic with partial data', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Updated Name',
      };

      const updatedTopic: Topic = {
        ...mockTopic,
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      mockPrismaService.topic.update.mockResolvedValue(updatedTopic);

      const result = await repository.update(1, updateDto);

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete a topic', async () => {
      mockPrismaService.topic.delete.mockResolvedValue(mockTopic);

      const result = await repository.delete(1);

      expect(result).toEqual(mockTopic);
      expect(mockPrismaService.topic.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('toResponseDto', () => {
    it('should transform topic to response DTO', () => {
      const result = repository.toResponseDto(mockTopicWithCounts);

      expect(result).toEqual({
        id: mockTopicWithCounts.id,
        name: mockTopicWithCounts.name,
        description: mockTopicWithCounts.description,
        image: mockTopicWithCounts.image,
        createdAt: mockTopicWithCounts.createdAt,
        updatedAt: mockTopicWithCounts.updatedAt,
        courseCount: mockTopicWithCounts.courseCount,
        subjectCount: mockTopicWithCounts.subjectCount,
        studentEnrollmentCount: mockTopicWithCounts.studentEnrollmentCount,
      });
    });

    it('should handle null optional fields', () => {
      const topicWithNulls: TopicWithCourseCount = {
        ...mockTopicWithCounts,
        description: null,
        image: null,
      };

      const result = repository.toResponseDto(topicWithNulls);

      expect(result.description).toBeNull();
      expect(result.image).toBeNull();
    });
  });

  describe('toResponseDtos', () => {
    it('should transform array of topics to response DTOs', () => {
      const topics: TopicWithCourseCount[] = [
        mockTopicWithCounts,
        {
          ...mockTopicWithCounts,
          id: 2,
          name: 'Science',
        },
      ];

      const result = repository.toResponseDtos(topics);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should return empty array for empty input', () => {
      const result = repository.toResponseDtos([]);

      expect(result).toEqual([]);
    });
  });
});
