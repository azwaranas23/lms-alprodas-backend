import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsRepository } from './subjects.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Subject, Topic } from '@prisma/client';
import { SubjectWithTopic } from '../types/subject.types';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

describe('SubjectsRepository', () => {
  let repository: SubjectsRepository;
  let prisma: PrismaService;

  const mockTopic: Topic = {
    id: 1,
    name: 'Mathematics',
    description: 'Math topic',
    image: 'http://example.com/math.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockSubject: Subject = {
    id: 1,
    name: 'Algebra',
    description: 'Algebra subject',
    image: 'http://example.com/algebra.jpg',
    topicId: 1,
    totalCourses: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockSubjectWithTopic: SubjectWithTopic = {
    ...mockSubject,
    topic: mockTopic,
    totalStudents: 25,
  };

  const mockPrismaService = {
    subject: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<SubjectsRepository>(SubjectsRepository);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findMany', () => {
    it('should return paginated subjects with topic relation and totalStudents', async () => {
      const query = { page: 1, limit: 10 };
      const subjectsWithCourses = [
        {
          ...mockSubject,
          topic: mockTopic,
          courses: [
            { totalStudents: 10 },
            { totalStudents: 15 },
          ],
        },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(subjectsWithCourses);
      mockPrismaService.subject.count.mockResolvedValue(1);

      const result = await repository.findMany(query);

      expect(result).toEqual({
        subjects: [
          {
            ...mockSubject,
            topic: mockTopic,
            courses: [
              { totalStudents: 10 },
              { totalStudents: 15 },
            ],
            totalStudents: 25,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      });

      expect(mockPrismaService.subject.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          topic: true,
          courses: {
            select: {
              totalStudents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(mockPrismaService.subject.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should apply search filter with case-insensitive matching', async () => {
      const query = { page: 1, limit: 10, search: 'Alg' };

      mockPrismaService.subject.findMany.mockResolvedValue([]);
      mockPrismaService.subject.count.mockResolvedValue(0);

      await repository.findMany(query);

      expect(mockPrismaService.subject.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'Alg', mode: 'insensitive' } },
        skip: 0,
        take: 10,
        include: {
          topic: true,
          courses: {
            select: {
              totalStudents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by topicId when provided', async () => {
      const query = { page: 1, limit: 10, topicId: 1 };

      mockPrismaService.subject.findMany.mockResolvedValue([]);
      mockPrismaService.subject.count.mockResolvedValue(0);

      await repository.findMany(query);

      expect(mockPrismaService.subject.findMany).toHaveBeenCalledWith({
        where: { topicId: 1 },
        skip: 0,
        take: 10,
        include: {
          topic: true,
          courses: {
            select: {
              totalStudents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should apply both search and topicId filters together', async () => {
      const query = { page: 1, limit: 10, search: 'Calc', topicId: 2 };

      mockPrismaService.subject.findMany.mockResolvedValue([]);
      mockPrismaService.subject.count.mockResolvedValue(0);

      await repository.findMany(query);

      expect(mockPrismaService.subject.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Calc', mode: 'insensitive' },
          topicId: 2,
        },
        skip: 0,
        take: 10,
        include: {
          topic: true,
          courses: {
            select: {
              totalStudents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should calculate correct skip value for pagination', async () => {
      const query = { page: 3, limit: 20 };

      mockPrismaService.subject.findMany.mockResolvedValue([]);
      mockPrismaService.subject.count.mockResolvedValue(0);

      await repository.findMany(query);

      expect(mockPrismaService.subject.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 40, // (3 - 1) * 20
        take: 20,
        include: {
          topic: true,
          courses: {
            select: {
              totalStudents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should handle subjects with no courses (zero totalStudents)', async () => {
      const query = { page: 1, limit: 10 };
      const subjectsWithNoCourses = [
        {
          ...mockSubject,
          topic: mockTopic,
          courses: [],
        },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(subjectsWithNoCourses);
      mockPrismaService.subject.count.mockResolvedValue(1);

      const result = await repository.findMany(query);

      expect(result.subjects[0].totalStudents).toBe(0);
    });

    it('should aggregate totalStudents correctly from multiple courses', async () => {
      const query = { page: 1, limit: 10 };
      const subjectsWithMultipleCourses = [
        {
          ...mockSubject,
          topic: mockTopic,
          courses: [
            { totalStudents: 5 },
            { totalStudents: 10 },
            { totalStudents: 8 },
          ],
        },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(
        subjectsWithMultipleCourses,
      );
      mockPrismaService.subject.count.mockResolvedValue(1);

      const result = await repository.findMany(query);

      expect(result.subjects[0].totalStudents).toBe(23); // 5 + 10 + 8
    });

    it('should handle null totalStudents in courses', async () => {
      const query = { page: 1, limit: 10 };
      const subjectsWithNullCourses = [
        {
          ...mockSubject,
          topic: mockTopic,
          courses: [
            { totalStudents: null },
            { totalStudents: 10 },
            { totalStudents: null },
          ],
        },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(
        subjectsWithNullCourses,
      );
      mockPrismaService.subject.count.mockResolvedValue(1);

      const result = await repository.findMany(query);

      expect(result.subjects[0].totalStudents).toBe(10); // Only counts non-null values
    });
  });

  describe('findById', () => {
    it('should return subject by id', async () => {
      mockPrismaService.subject.findUnique.mockResolvedValue(mockSubject);

      const result = await repository.findById(1);

      expect(result).toEqual(mockSubject);
      expect(mockPrismaService.subject.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when subject not found', async () => {
      mockPrismaService.subject.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithTopic', () => {
    it('should return subject with topic relation', async () => {
      const subjectWithTopic = {
        ...mockSubject,
        topic: mockTopic,
      };

      mockPrismaService.subject.findUnique.mockResolvedValue(subjectWithTopic);

      const result = await repository.findByIdWithTopic(1);

      expect(result).toEqual(subjectWithTopic);
      expect(mockPrismaService.subject.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { topic: true },
      });
    });

    it('should return null when subject not found', async () => {
      mockPrismaService.subject.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithTopic(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new subject with topic_id mapped to topicId', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Geometry',
        description: 'Geometry subject',
        image: 'http://example.com/geometry.jpg',
        topic_id: 1,
      };

      const newSubject: Subject = {
        id: 2,
        name: createDto.name,
        description: createDto.description ?? null,
        image: createDto.image ?? null,
        topicId: 1,
        totalCourses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.subject.create.mockResolvedValue(newSubject);

      const result = await repository.create(createDto);

      expect(result).toEqual(newSubject);
      expect(mockPrismaService.subject.create).toHaveBeenCalledWith({
        data: {
          name: 'Geometry',
          description: 'Geometry subject',
          image: 'http://example.com/geometry.jpg',
          topicId: 1,
        },
      });
    });

    it('should create subject with optional fields as undefined', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Physics',
        topic_id: 2,
      };

      const newSubject: Subject = {
        id: 3,
        name: 'Physics',
        description: null,
        image: null,
        topicId: 2,
        totalCourses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.subject.create.mockResolvedValue(newSubject);

      const result = await repository.create(createDto);

      expect(result).toEqual(newSubject);
      expect(mockPrismaService.subject.create).toHaveBeenCalledWith({
        data: {
          name: 'Physics',
          description: undefined,
          image: undefined,
          topicId: 2,
        },
      });
    });
  });

  describe('update', () => {
    it('should update an existing subject', async () => {
      const updateDto: UpdateSubjectDto = {
        name: 'Advanced Algebra',
        description: 'Updated description',
        image: 'http://example.com/new-algebra.jpg',
        topic_id: 2,
      };

      const updatedSubject: Subject = {
        id: 1,
        name: updateDto.name ?? '',
        description: updateDto.description ?? null,
        image: updateDto.image ?? null,
        topicId: 2,
        totalCourses: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaService.subject.update.mockResolvedValue(updatedSubject);

      const result = await repository.update(1, updateDto);

      expect(result).toEqual(updatedSubject);
      expect(mockPrismaService.subject.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Advanced Algebra',
          description: 'Updated description',
          image: 'http://example.com/new-algebra.jpg',
          topicId: 2,
        },
      });
    });

    it('should update subject with partial data', async () => {
      const updateDto: UpdateSubjectDto = {
        name: 'Updated Name',
      };

      const updatedSubject: Subject = {
        ...mockSubject,
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      mockPrismaService.subject.update.mockResolvedValue(updatedSubject);

      const result = await repository.update(1, updateDto);

      expect(result.name).toBe('Updated Name');
    });

    it('should handle topic_id mapping when provided', async () => {
      const updateDto: UpdateSubjectDto = {
        topic_id: 3,
      };

      const updatedSubject: Subject = {
        ...mockSubject,
        topicId: 3,
      };

      mockPrismaService.subject.update.mockResolvedValue(updatedSubject);

      await repository.update(1, updateDto);

      expect(mockPrismaService.subject.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: undefined,
          description: undefined,
          image: undefined,
          topicId: 3,
        },
      });
    });

    it('should handle update without topic_id', async () => {
      const updateDto: UpdateSubjectDto = {
        name: 'New Name',
        description: 'New Description',
      };

      const updatedSubject: Subject = {
        ...mockSubject,
        name: 'New Name',
        description: 'New Description',
      };

      mockPrismaService.subject.update.mockResolvedValue(updatedSubject);

      await repository.update(1, updateDto);

      expect(mockPrismaService.subject.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'New Name',
          description: 'New Description',
          image: undefined,
          topicId: undefined,
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a subject', async () => {
      mockPrismaService.subject.delete.mockResolvedValue(mockSubject);

      const result = await repository.delete(1);

      expect(result).toEqual(mockSubject);
      expect(mockPrismaService.subject.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('toResponseDto', () => {
    it('should transform subject to response DTO', () => {
      const subjectWithTopic: SubjectWithTopic = {
        ...mockSubject,
        topic: mockTopic,
        totalStudents: 30,
      };

      const result = repository.toResponseDto(subjectWithTopic);

      expect(result).toEqual({
        id: 1,
        name: 'Algebra',
        description: 'Algebra subject',
        image: 'http://example.com/algebra.jpg',
        topicId: 1,
        topic: {
          id: 1,
          name: 'Mathematics',
          description: 'Math topic',
          image: 'http://example.com/math.jpg',
        },
        totalCourses: 0,
        totalStudents: 30,
      });
    });

    it('should handle null optional fields', () => {
      const subjectWithNulls: SubjectWithTopic = {
        ...mockSubject,
        description: null,
        image: null,
        topic: {
          ...mockTopic,
          description: null,
          image: null,
        },
        totalStudents: 0,
      };

      const result = repository.toResponseDto(subjectWithNulls);

      expect(result.description).toBeNull();
      expect(result.image).toBeNull();
      expect(result.topic.description).toBeNull();
      expect(result.topic.image).toBeNull();
    });

    it('should handle undefined totalStudents with default value', () => {
      const subjectWithoutTotal: SubjectWithTopic = {
        ...mockSubject,
        topic: mockTopic,
      };

      const result = repository.toResponseDto(subjectWithoutTotal);

      expect(result.totalStudents).toBe(0);
    });

    it('should handle undefined totalCourses with default value', () => {
      const subjectWithTopic: SubjectWithTopic = {
        ...mockSubject,
        topic: mockTopic,
      };

      const result = repository.toResponseDto(subjectWithTopic);

      expect(result.totalCourses).toBe(0);
    });
  });

  describe('toResponseDtos', () => {
    it('should transform array of subjects to response DTOs', () => {
      const subjects: SubjectWithTopic[] = [
        {
          ...mockSubject,
          topic: mockTopic,
          totalStudents: 25,
        },
        {
          ...mockSubject,
          id: 2,
          name: 'Calculus',
          topic: mockTopic,
          totalStudents: 30,
        },
      ];

      const result = repository.toResponseDtos(subjects);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Algebra');
      expect(result[1].id).toBe(2);
      expect(result[1].name).toBe('Calculus');
    });

    it('should return empty array for empty input', () => {
      const result = repository.toResponseDtos([]);

      expect(result).toEqual([]);
    });
  });
});
