import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from '../services/subjects.service';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { QuerySubjectsDto } from '../dto/query-subjects.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { SubjectsResponseDto } from '../dto/subjects-response.dto';
import { Readable } from 'stream';

describe('SubjectsController', () => {
  let controller: SubjectsController;
  let service: SubjectsService;
  let fileUploadService: FileUploadService;

  const mockSubjectResponseDto: SubjectsResponseDto = {
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

  const mockPaginatedResponse: PaginatedResponse<SubjectsResponseDto> = {
    items: [mockSubjectResponseDto],
    meta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  const mockSubjectsService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFileUploadService = {
    getFileUrl: jest.fn(),
  };

  const mockPermissionsGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectsController],
      providers: [
        {
          provide: SubjectsService,
          useValue: mockSubjectsService,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<SubjectsController>(SubjectsController);
    service = module.get<SubjectsService>(SubjectsService);
    fileUploadService = module.get<FileUploadService>(FileUploadService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated subjects', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10 };
      const expectedResponse: BaseResponse<
        PaginatedResponse<SubjectsResponseDto>
      > = {
        message: 'Subjects retrieved successfully',
        data: mockPaginatedResponse,
      };

      mockSubjectsService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(query);

      expect(result).toEqual(expectedResponse);
      expect(mockSubjectsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle search query parameter', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10, search: 'Alg' };
      const expectedResponse: BaseResponse<
        PaginatedResponse<SubjectsResponseDto>
      > = {
        message: 'Subjects retrieved successfully',
        data: mockPaginatedResponse,
      };

      mockSubjectsService.findAll.mockResolvedValue(expectedResponse);

      await controller.findAll(query);

      expect(mockSubjectsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle topicId filter parameter', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10, topicId: 1 };
      const expectedResponse: BaseResponse<
        PaginatedResponse<SubjectsResponseDto>
      > = {
        message: 'Subjects retrieved successfully',
        data: mockPaginatedResponse,
      };

      mockSubjectsService.findAll.mockResolvedValue(expectedResponse);

      await controller.findAll(query);

      expect(mockSubjectsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should use default pagination values when not provided', async () => {
      const query: any = {};
      const expectedResponse: BaseResponse<
        PaginatedResponse<SubjectsResponseDto>
      > = {
        message: 'Subjects retrieved successfully',
        data: mockPaginatedResponse,
      };

      mockSubjectsService.findAll.mockResolvedValue(expectedResponse);

      await controller.findAll(query);

      expect(mockSubjectsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty result when no subjects found', async () => {
      const query: QuerySubjectsDto = { page: 1, limit: 10 };
      const emptyResponse: BaseResponse<
        PaginatedResponse<SubjectsResponseDto>
      > = {
        message: 'Subjects retrieved successfully',
        data: {
          items: [],
          meta: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockSubjectsService.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(query);

      expect(result.data?.items).toEqual([]);
      expect(result.data?.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return subject by id', async () => {
      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject retrieved successfully',
        data: mockSubjectResponseDto,
      };

      mockSubjectsService.findById.mockResolvedValue(expectedResponse);

      const result = await controller.findById(1);

      expect(result).toEqual(expectedResponse);
      expect(mockSubjectsService.findById).toHaveBeenCalledWith(1);
    });

    it('should parse id as integer using ParseIntPipe', async () => {
      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject retrieved successfully',
        data: mockSubjectResponseDto,
      };

      mockSubjectsService.findById.mockResolvedValue(expectedResponse);

      await controller.findById(1);

      expect(mockSubjectsService.findById).toHaveBeenCalledWith(1);
      expect(typeof 1).toBe('number');
    });

    it('should handle service throwing NotFoundException', async () => {
      mockSubjectsService.findById.mockRejectedValue(
        new Error('Subject not found'),
      );

      await expect(controller.findById(999)).rejects.toThrow(
        'Subject not found',
      );
    });

    it('should return subject with topic relation', async () => {
      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject retrieved successfully',
        data: mockSubjectResponseDto,
      };

      mockSubjectsService.findById.mockResolvedValue(expectedResponse);

      const result = await controller.findById(1);

      expect(result.data?.topic).toBeDefined();
      expect(result.data?.topic.id).toBe(1);
      expect(result.data?.topic.name).toBe('Mathematics');
    });
  });

  describe('create', () => {
    it('should create subject with image upload', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Geometry',
        description: 'Geometry subject',
        topic_id: 1,
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'geometry.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'geometry-123.jpg',
        path: '/uploads/subjects/geometry-123.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/subjects',
      } as Express.Multer.File;

      const imageUrl = 'http://example.com/uploads/subjects/geometry-123.jpg';
      const expectedSubject = {
        ...mockSubjectResponseDto,
        id: 2,
        name: 'Geometry',
        description: 'Geometry subject',
        image: imageUrl,
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject created successfully',
        data: expectedSubject,
      };

      mockFileUploadService.getFileUrl.mockReturnValue(imageUrl);
      mockSubjectsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto, mockFile);

      expect(mockFileUploadService.getFileUrl).toHaveBeenCalledWith(
        'geometry-123.jpg',
        'uploads/subjects',
      );
      expect(mockSubjectsService.create).toHaveBeenCalledWith({
        ...createDto,
        image: imageUrl,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should create subject without image upload', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Physics',
        description: 'Physics subject',
        topic_id: 2,
      };

      const expectedSubject = {
        ...mockSubjectResponseDto,
        id: 3,
        name: 'Physics',
        description: 'Physics subject',
        image: null,
        topicId: 2,
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject created successfully',
        data: expectedSubject,
      };

      mockSubjectsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto);

      expect(mockFileUploadService.getFileUrl).not.toHaveBeenCalled();
      expect(mockSubjectsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle undefined image file', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Biology',
        topic_id: 1,
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject created successfully',
        data: {
          ...mockSubjectResponseDto,
          id: 4,
          name: 'Biology',
        },
      };

      mockSubjectsService.create.mockResolvedValue(expectedResponse);

      await controller.create(createDto, undefined);

      expect(mockSubjectsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should use FileInterceptor with correct destination', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Chemistry',
        topic_id: 1,
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'chem.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'chem-456.jpg',
        path: '/uploads/subjects/chem-456.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/subjects',
      } as Express.Multer.File;

      const imageUrl = 'http://example.com/uploads/subjects/chem-456.jpg';

      mockFileUploadService.getFileUrl.mockReturnValue(imageUrl);
      mockSubjectsService.create.mockResolvedValue({
        message: 'Subject created successfully',
        data: mockSubjectResponseDto,
      });

      await controller.create(createDto, mockFile);

      expect(mockFileUploadService.getFileUrl).toHaveBeenCalledWith(
        'chem-456.jpg',
        'uploads/subjects',
      );
    });
  });

  describe('update', () => {
    it('should update subject with new image', async () => {
      const updateDto: CreateSubjectDto = {
        name: 'Advanced Algebra',
        description: 'Updated description',
        topic_id: 1,
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'new-algebra.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        filename: 'new-algebra-789.jpg',
        path: '/uploads/subjects/new-algebra-789.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/subjects',
      } as Express.Multer.File;

      const imageUrl = 'http://example.com/uploads/subjects/new-algebra-789.jpg';
      const updatedSubject = {
        ...mockSubjectResponseDto,
        name: 'Advanced Algebra',
        description: 'Updated description',
        image: imageUrl,
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject updated successfully',
        data: updatedSubject,
      };

      mockFileUploadService.getFileUrl.mockReturnValue(imageUrl);
      mockSubjectsService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(1, updateDto, mockFile);

      expect(mockFileUploadService.getFileUrl).toHaveBeenCalledWith(
        'new-algebra-789.jpg',
        'uploads/subjects',
      );
      expect(mockSubjectsService.update).toHaveBeenCalledWith(1, {
        ...updateDto,
        image: imageUrl,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should update subject without changing image', async () => {
      const updateDto: CreateSubjectDto = {
        name: 'Updated Name',
        description: 'Updated description',
        topic_id: 1,
      };

      const updatedSubject = {
        ...mockSubjectResponseDto,
        name: 'Updated Name',
        description: 'Updated description',
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject updated successfully',
        data: updatedSubject,
      };

      mockSubjectsService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(1, updateDto);

      expect(mockFileUploadService.getFileUrl).not.toHaveBeenCalled();
      expect(mockSubjectsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle partial update with only name', async () => {
      const updateDto: CreateSubjectDto = {
        name: 'New Name',
        topic_id: 1,
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject updated successfully',
        data: {
          ...mockSubjectResponseDto,
          name: 'New Name',
        },
      };

      mockSubjectsService.update.mockResolvedValue(expectedResponse);

      await controller.update(1, updateDto);

      expect(mockSubjectsService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should parse id as integer using ParseIntPipe', async () => {
      const updateDto: CreateSubjectDto = {
        name: 'Updated Name',
        topic_id: 1,
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject updated successfully',
        data: mockSubjectResponseDto,
      };

      mockSubjectsService.update.mockResolvedValue(expectedResponse);

      await controller.update(1, updateDto);

      expect(mockSubjectsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(typeof 1).toBe('number');
    });

    it('should conditionally add image only when file is uploaded', async () => {
      const updateDto: CreateSubjectDto = {
        name: 'Test',
        topic_id: 1,
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'test-123.jpg',
        path: '/uploads/subjects/test-123.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/subjects',
      } as Express.Multer.File;

      const imageUrl = 'http://example.com/uploads/subjects/test-123.jpg';

      mockFileUploadService.getFileUrl.mockReturnValue(imageUrl);
      mockSubjectsService.update.mockResolvedValue({
        message: 'Subject updated successfully',
        data: mockSubjectResponseDto,
      });

      await controller.update(1, updateDto, mockFile);

      expect(mockSubjectsService.update).toHaveBeenCalledWith(1, {
        name: 'Test',
        topic_id: 1,
        image: imageUrl,
      });
    });

    it('should update topicId when provided', async () => {
      const updateDto: CreateSubjectDto = {
        name: 'Subject with new topic',
        topic_id: 2,
      };

      const expectedResponse: BaseResponse<SubjectsResponseDto> = {
        message: 'Subject updated successfully',
        data: {
          ...mockSubjectResponseDto,
          topicId: 2,
          topic: {
            id: 2,
            name: 'Science',
            description: 'Science topic',
            image: null,
          },
        },
      };

      mockSubjectsService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(1, updateDto);

      expect(result.data?.topicId).toBe(2);
      expect(mockSubjectsService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('delete', () => {
    it('should delete subject and return null data', async () => {
      const expectedResponse: BaseResponse<null> = {
        message: 'Subject deleted successfully',
        data: null,
      };

      mockSubjectsService.delete.mockResolvedValue(expectedResponse);

      const result = await controller.delete(1);

      expect(result).toEqual(expectedResponse);
      expect(mockSubjectsService.delete).toHaveBeenCalledWith(1);
    });

    it('should parse id as integer using ParseIntPipe', async () => {
      const expectedResponse: BaseResponse<null> = {
        message: 'Subject deleted successfully',
        data: null,
      };

      mockSubjectsService.delete.mockResolvedValue(expectedResponse);

      await controller.delete(1);

      expect(mockSubjectsService.delete).toHaveBeenCalledWith(1);
      expect(typeof 1).toBe('number');
    });

    it('should handle service throwing NotFoundException', async () => {
      mockSubjectsService.delete.mockRejectedValue(
        new Error('Subject not found'),
      );

      await expect(controller.delete(999)).rejects.toThrow(
        'Subject not found',
      );
    });
  });

  describe('Permissions and Guards', () => {
    it('should use PermissionsGuard for all routes', () => {
      const guards = Reflect.getMetadata('__guards__', SubjectsController);
      expect(guards).toBeDefined();
    });

    it('should require subjects.read permission for findAll', () => {
      const permissions = Reflect.getMetadata(
        'permissions',
        controller.findAll,
      );
      expect(permissions).toEqual(['subjects.read']);
    });

    it('should require subjects.read permission for findById', () => {
      const permissions = Reflect.getMetadata(
        'permissions',
        controller.findById,
      );
      expect(permissions).toEqual(['subjects.read']);
    });

    it('should require subjects.create permission for create', () => {
      const permissions = Reflect.getMetadata('permissions', controller.create);
      expect(permissions).toEqual(['subjects.create']);
    });

    it('should require subjects.update permission for update', () => {
      const permissions = Reflect.getMetadata('permissions', controller.update);
      expect(permissions).toEqual(['subjects.update']);
    });

    it('should require subjects.delete permission for delete', () => {
      const permissions = Reflect.getMetadata('permissions', controller.delete);
      expect(permissions).toEqual(['subjects.delete']);
    });
  });

  describe('File Upload Configuration', () => {
    it('should use FileInterceptor for create with correct config', () => {
      const interceptors = Reflect.getMetadata(
        '__interceptors__',
        controller.create,
      );
      expect(interceptors).toBeDefined();
    });

    it('should use FileInterceptor for update with correct config', () => {
      const interceptors = Reflect.getMetadata(
        '__interceptors__',
        controller.update,
      );
      expect(interceptors).toBeDefined();
    });

    it('should upload files to ./uploads/subjects directory', async () => {
      const createDto: CreateSubjectDto = {
        name: 'Test',
        topic_id: 1,
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'test.jpg',
        path: '/uploads/subjects/test.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/subjects',
      } as Express.Multer.File;

      mockFileUploadService.getFileUrl.mockReturnValue(
        'http://example.com/uploads/subjects/test.jpg',
      );
      mockSubjectsService.create.mockResolvedValue({
        message: 'Subject created successfully',
        data: mockSubjectResponseDto,
      });

      await controller.create(createDto, mockFile);

      expect(mockFileUploadService.getFileUrl).toHaveBeenCalledWith(
        'test.jpg',
        'uploads/subjects',
      );
    });
  });
});
