import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';
import { SubjectsRepository } from '../repositories/subjects.repository';
import { NotFoundException } from '@nestjs/common';
import { Subject } from '@prisma/client';
import { SubjectWithTopic } from '../types/subject.types';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { QuerySubjectsDto } from '../dto/query-subjects.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let repository: SubjectsRepository;

  const mockTopic = {
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

  const mockSubjectResponseDto = {
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
    totalStudents: 25,
  };

  const mockRepository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findByIdWithTopic: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toResponseDto: jest.fn(),
    toResponseDtos: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        {
          provide: SubjectsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
    repository = module.get<SubjectsRepository>(SubjectsRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated subjects with BaseResponse wrapper', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10 };
      const repositoryResult = {
        subjects: [mockSubjectWithTopic],
        total: 1,
        page: 1,
        limit: 10,
      };

      const paginatedData = PaginationUtil.createResponse(
        [mockSubjectResponseDto],
        1,
        10,
        1,
      );

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([mockSubjectResponseDto]);

      const result = await service.findAll(query);

      expect(result).toEqual({
        message: 'Subjects retrieved successfully',
        data: paginatedData,
      });
      expect(mockRepository.findMany).toHaveBeenCalledWith(query);
      expect(mockRepository.toResponseDtos).toHaveBeenCalledWith([
        mockSubjectWithTopic,
      ]);
    });

    it('should handle search query parameter', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10, search: 'Alg' };
      const repositoryResult = {
        subjects: [mockSubjectWithTopic],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([mockSubjectResponseDto]);

      await service.findAll(query);

      expect(mockRepository.findMany).toHaveBeenCalledWith(query);
    });

    it('should handle topicId filter parameter', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10, topicId: 1 };
      const repositoryResult = {
        subjects: [mockSubjectWithTopic],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([mockSubjectResponseDto]);

      await service.findAll(query);

      expect(mockRepository.findMany).toHaveBeenCalledWith(query);
    });

    it('should return empty paginated result when no subjects found', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10 };
      const repositoryResult = {
        subjects: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      const paginatedData = PaginationUtil.createResponse([], 1, 10, 0);

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([]);

      const result = await service.findAll(query);

      expect(result).toEqual({
        message: 'Subjects retrieved successfully',
        data: paginatedData,
      });
    });

    it('should handle custom page and limit values', async () => {
      const query: QuerySubjectsDto = { page: 3, limit: 20 };
      const repositoryResult = {
        subjects: [mockSubjectWithTopic],
        total: 50,
        page: 3,
        limit: 20,
      };

      mockRepository.findMany.mockResolvedValue(repositoryResult);
      mockRepository.toResponseDtos.mockReturnValue([mockSubjectResponseDto]);

      const result = await service.findAll(query);

      expect((result.data as any)?.meta.page).toBe(3);
      expect((result.data as any)?.meta.limit).toBe(20);
    });
  });

  describe('findById', () => {
    it('should return subject with BaseResponse wrapper when found', async () => {
      mockRepository.findByIdWithTopic.mockResolvedValue(mockSubjectWithTopic);
      mockRepository.toResponseDto.mockReturnValue(mockSubjectResponseDto);

      const result = await service.findById(1);

      expect(result).toEqual({
        message: 'Subject retrieved successfully',
        data: mockSubjectResponseDto,
      });
      expect(mockRepository.findByIdWithTopic).toHaveBeenCalledWith(1);
      expect(mockRepository.toResponseDto).toHaveBeenCalledWith(
        mockSubjectWithTopic,
      );
    });

    it('should throw NotFoundException when subject not found', async () => {
      mockRepository.findByIdWithTopic.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow('Subject not found');
    });

    it('should return subject with topic relation', async () => {
      const subjectWithTopic: SubjectWithTopic = {
        ...mockSubject,
        topic: mockTopic,
      };

      mockRepository.findByIdWithTopic.mockResolvedValue(subjectWithTopic);
      mockRepository.toResponseDto.mockReturnValue({
        ...mockSubjectResponseDto,
        topic: mockTopic,
      });

      const result = await service.findById(1);

      expect(result.data?.topic).toBeDefined();
      expect(result.data?.topic.id).toBe(1);
      expect(result.data?.topic.name).toBe('Mathematics');
    });
  });

  describe('create', () => {
    it('should create subject and return BaseResponse', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Geometry',
        description: 'Geometry subject',
        image: 'http://example.com/geometry.jpg',
        topic_id: 1,
      };

      const createdSubject: Subject = {
        id: 2,
        name: createDto.name,
        description: createDto.description ?? null,
        image: createDto.image ?? null,
        topicId: 1,
        totalCourses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const subjectWithTopic: SubjectWithTopic = {
        ...createdSubject,
        topic: mockTopic,
      };

      const responseDto = {
        ...mockSubjectResponseDto,
        id: 2,
        name: 'Geometry',
        description: 'Geometry subject',
        image: 'http://example.com/geometry.jpg',
      };

      mockRepository.create.mockResolvedValue(createdSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(subjectWithTopic);
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.create(createDto);

      expect(result).toEqual({
        message: 'Subject created successfully',
        data: responseDto,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.findByIdWithTopic).toHaveBeenCalledWith(2);
      expect(mockRepository.toResponseDto).toHaveBeenCalledWith(
        subjectWithTopic,
      );
    });

    it('should fetch subject with topic after creation', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Physics',
        topic_id: 2,
      };

      const createdSubject: Subject = {
        id: 3,
        name: 'Physics',
        description: null,
        image: null,
        topicId: 2,
        totalCourses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const subjectWithTopic: SubjectWithTopic = {
        ...createdSubject,
        topic: { ...mockTopic, id: 2, name: 'Science' },
      };

      mockRepository.create.mockResolvedValue(createdSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(subjectWithTopic);
      mockRepository.toResponseDto.mockReturnValue({
        ...mockSubjectResponseDto,
        id: 3,
        topicId: 2,
      });

      await service.create(createDto);

      expect(mockRepository.findByIdWithTopic).toHaveBeenCalledWith(3);
    });

    it('should throw NotFoundException when subject not found after creation', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Biology',
        topic_id: 1,
      };

      const createdSubject: Subject = {
        id: 4,
        name: 'Biology',
        description: null,
        image: null,
        topicId: 1,
        totalCourses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(createdSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Subject not found after creation',
      );
    });

    it('should create subject with optional fields as null', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Chemistry',
        topic_id: 1,
      };

      const createdSubject: Subject = {
        id: 5,
        name: 'Chemistry',
        description: null,
        image: null,
        topicId: 1,
        totalCourses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const subjectWithTopic: SubjectWithTopic = {
        ...createdSubject,
        topic: mockTopic,
      };

      const responseDto = {
        ...mockSubjectResponseDto,
        id: 5,
        name: 'Chemistry',
        description: null,
        image: null,
      };

      mockRepository.create.mockResolvedValue(createdSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(subjectWithTopic);
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.create(createDto);

      expect(result.data?.description).toBeNull();
      expect(result.data?.image).toBeNull();
    });
  });

  describe('update', () => {
    it('should update subject and return BaseResponse', async () => {
      const updateDto: UpdateSubjectDto = {
        name: 'Advanced Algebra',
        description: 'Updated description',
      };

      const updatedSubject: Subject = {
        ...mockSubject,
        ...updateDto,
        updatedAt: new Date('2024-01-02'),
      };

      const updatedSubjectWithTopic: SubjectWithTopic = {
        ...updatedSubject,
        topic: mockTopic,
        totalStudents: 30,
      };

      const responseDto = {
        ...mockSubjectResponseDto,
        name: 'Advanced Algebra',
        description: 'Updated description',
        totalStudents: 30,
      };

      mockRepository.findById.mockResolvedValue(mockSubject);
      mockRepository.update.mockResolvedValue(updatedSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(
        updatedSubjectWithTopic,
      );
      mockRepository.toResponseDto.mockReturnValue(responseDto);

      const result = await service.update(1, updateDto);

      expect(result).toEqual({
        message: 'Subject updated successfully',
        data: responseDto,
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(mockRepository.findByIdWithTopic).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when subject does not exist', async () => {
      const updateDto: UpdateSubjectDto = {
        name: 'Updated Name',
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateDto)).rejects.toThrow(
        'Subject not found',
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.findByIdWithTopic).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when subject not found after update', async () => {
      const updateDto: UpdateSubjectDto = {
        name: 'Updated Name',
      };

      mockRepository.findById.mockResolvedValue(mockSubject);
      mockRepository.update.mockResolvedValue(mockSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(null);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Subject not found after update',
      );
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateSubjectDto = {
        name: 'Updated Name',
      };

      const updatedSubject: Subject = {
        ...mockSubject,
        name: 'Updated Name',
      };

      const updatedSubjectWithTopic: SubjectWithTopic = {
        ...updatedSubject,
        topic: mockTopic,
        totalStudents: 25,
      };

      mockRepository.findById.mockResolvedValue(mockSubject);
      mockRepository.update.mockResolvedValue(updatedSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(
        updatedSubjectWithTopic,
      );
      mockRepository.toResponseDto.mockReturnValue({
        ...mockSubjectResponseDto,
        name: 'Updated Name',
      });

      const result = await service.update(1, updateDto);

      expect(result.data?.name).toBe('Updated Name');
    });

    it('should fetch updated subject with topic relation', async () => {
      const updateDto: UpdateSubjectDto = {
        topic_id: 2,
      };

      const updatedSubject: Subject = {
        ...mockSubject,
        topicId: 2,
      };

      const newTopic = { ...mockTopic, id: 2, name: 'Science' };
      const updatedSubjectWithTopic: SubjectWithTopic = {
        ...updatedSubject,
        topic: newTopic,
      };

      mockRepository.findById.mockResolvedValue(mockSubject);
      mockRepository.update.mockResolvedValue(updatedSubject);
      mockRepository.findByIdWithTopic.mockResolvedValue(
        updatedSubjectWithTopic,
      );
      mockRepository.toResponseDto.mockReturnValue({
        ...mockSubjectResponseDto,
        topicId: 2,
        topic: newTopic,
      });

      const result = await service.update(1, updateDto);

      expect(result.data?.topicId).toBe(2);
      expect(result.data?.topic.name).toBe('Science');
    });
  });

  describe('delete', () => {
    it('should delete subject and return BaseResponse with null data', async () => {
      mockRepository.findById.mockResolvedValue(mockSubject);
      mockRepository.delete.mockResolvedValue(mockSubject);

      const result = await service.delete(1);

      expect(result).toEqual({
        message: 'Subject deleted successfully',
        data: null,
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when subject does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      await expect(service.delete(999)).rejects.toThrow('Subject not found');

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should verify subject exists before deletion', async () => {
      mockRepository.findById.mockResolvedValue(mockSubject);
      mockRepository.delete.mockResolvedValue(mockSubject);

      await service.delete(1);

      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalled();
    });
  });
});
