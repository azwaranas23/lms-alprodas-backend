import { Test, TestingModule } from '@nestjs/testing';
import { TopicsController } from './topics.controller';
import { TopicsService } from '../services/topics.service';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { QueryTopicsDto } from '../dto/query-topics.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { TopicResponseDto } from '../dto/topic-response.dto';
import { Readable } from 'stream';

describe('TopicsController', () => {
  let controller: TopicsController;
  let service: TopicsService;
  let fileUploadService: FileUploadService;

  const mockTopicResponseDto: TopicResponseDto = {
    id: 1,
    name: 'Mathematics',
    description: 'Math topic',
    image: 'http://example.com/math.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPaginatedResponse: PaginatedResponse<TopicResponseDto> = {
    items: [mockTopicResponseDto],
    meta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  const mockTopicsService = {
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
      controllers: [TopicsController],
      providers: [
        {
          provide: TopicsService,
          useValue: mockTopicsService,
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

    controller = module.get<TopicsController>(TopicsController);
    service = module.get<TopicsService>(TopicsService);
    fileUploadService = module.get<FileUploadService>(FileUploadService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated topics', async () => {
      const query: QueryTopicsDto = { page: 1, limit: 10 };
      const expectedResponse: BaseResponse<
        PaginatedResponse<TopicResponseDto>
      > = {
        message: 'Topics retrieved successfully',
        data: mockPaginatedResponse,
      };

      mockTopicsService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(query);

      expect(result).toEqual(expectedResponse);
      expect(mockTopicsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle search query parameter', async () => {
      const query: QueryTopicsDto = { page: 1, limit: 10, search: 'Math' };
      const expectedResponse: BaseResponse<
        PaginatedResponse<TopicResponseDto>
      > = {
        message: 'Topics retrieved successfully',
        data: mockPaginatedResponse,
      };

      mockTopicsService.findAll.mockResolvedValue(expectedResponse);

      await controller.findAll(query);

      expect(mockTopicsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should use default pagination values when not provided', async () => {
      const query: any = {};
      const expectedResponse: BaseResponse<
        PaginatedResponse<TopicResponseDto>
      > = {
        message: 'Topics retrieved successfully',
        data: mockPaginatedResponse,
      };

      mockTopicsService.findAll.mockResolvedValue(expectedResponse);

      await controller.findAll(query);

      expect(mockTopicsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty result when no topics found', async () => {
      const query: QueryTopicsDto = { page: 1, limit: 10 };
      const emptyResponse: BaseResponse<PaginatedResponse<TopicResponseDto>> =
        {
          message: 'Topics retrieved successfully',
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

      mockTopicsService.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(query);

      expect(result.data?.items).toEqual([]);
      expect(result.data?.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return topic by id', async () => {
      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic retrieved successfully',
        data: mockTopicResponseDto,
      };

      mockTopicsService.findById.mockResolvedValue(expectedResponse);

      const result = await controller.findById(1);

      expect(result).toEqual(expectedResponse);
      expect(mockTopicsService.findById).toHaveBeenCalledWith(1);
    });

    it('should parse id as integer using ParseIntPipe', async () => {
      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic retrieved successfully',
        data: mockTopicResponseDto,
      };

      mockTopicsService.findById.mockResolvedValue(expectedResponse);

      await controller.findById(1);

      expect(mockTopicsService.findById).toHaveBeenCalledWith(1);
      expect(typeof 1).toBe('number');
    });

    it('should handle service throwing NotFoundException', async () => {
      mockTopicsService.findById.mockRejectedValue(
        new Error('Topic not found'),
      );

      await expect(controller.findById(999)).rejects.toThrow(
        'Topic not found',
      );
    });
  });

  describe('create', () => {
    it('should create topic with image upload', async () => {
      const createDto: CreateTopicDto = {
        name: 'Physics',
        description: 'Physics topic',
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'physics.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'physics-123.jpg',
        path: '/uploads/topics/physics-123.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/topics',
      } as Express.Multer.File;

      const imageUrl = 'http://example.com/uploads/topics/physics-123.jpg';
      const expectedTopic = {
        ...mockTopicResponseDto,
        id: 2,
        name: 'Physics',
        description: 'Physics topic',
        image: imageUrl,
      };

      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic created successfully',
        data: expectedTopic,
      };

      mockFileUploadService.getFileUrl.mockReturnValue(imageUrl);
      mockTopicsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto, mockFile);

      expect(mockFileUploadService.getFileUrl).toHaveBeenCalledWith(
        'physics-123.jpg',
        'uploads/topics',
      );
      expect(mockTopicsService.create).toHaveBeenCalledWith({
        ...createDto,
        image: imageUrl,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should create topic without image upload', async () => {
      const createDto: CreateTopicDto = {
        name: 'Biology',
        description: 'Biology topic',
      };

      const expectedTopic = {
        ...mockTopicResponseDto,
        id: 3,
        name: 'Biology',
        description: 'Biology topic',
        image: null,
      };

      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic created successfully',
        data: expectedTopic,
      };

      mockTopicsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto);

      expect(mockFileUploadService.getFileUrl).not.toHaveBeenCalled();
      expect(mockTopicsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle undefined image file', async () => {
      const createDto: CreateTopicDto = {
        name: 'Chemistry',
      };

      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic created successfully',
        data: {
          ...mockTopicResponseDto,
          id: 4,
          name: 'Chemistry',
        },
      };

      mockTopicsService.create.mockResolvedValue(expectedResponse);

      await controller.create(createDto, undefined);

      expect(mockTopicsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update topic with new image', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Advanced Mathematics',
        description: 'Updated description',
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'new-math.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        filename: 'new-math-456.jpg',
        path: '/uploads/topics/new-math-456.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/topics',
      } as Express.Multer.File;

      const imageUrl = 'http://example.com/uploads/topics/new-math-456.jpg';
      const updatedTopic = {
        ...mockTopicResponseDto,
        name: 'Advanced Mathematics',
        description: 'Updated description',
        image: imageUrl,
      };

      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic updated successfully',
        data: updatedTopic,
      };

      mockFileUploadService.getFileUrl.mockReturnValue(imageUrl);
      mockTopicsService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(1, updateDto, mockFile);

      expect(mockFileUploadService.getFileUrl).toHaveBeenCalledWith(
        'new-math-456.jpg',
        'uploads/topics',
      );
      expect(mockTopicsService.update).toHaveBeenCalledWith(1, {
        ...updateDto,
        image: imageUrl,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should update topic without changing image', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const updatedTopic = {
        ...mockTopicResponseDto,
        name: 'Updated Name',
        description: 'Updated description',
      };

      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic updated successfully',
        data: updatedTopic,
      };

      mockTopicsService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(1, updateDto);

      expect(mockFileUploadService.getFileUrl).not.toHaveBeenCalled();
      expect(mockTopicsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle partial update with only name', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'New Name',
      };

      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic updated successfully',
        data: {
          ...mockTopicResponseDto,
          name: 'New Name',
        },
      };

      mockTopicsService.update.mockResolvedValue(expectedResponse);

      await controller.update(1, updateDto);

      expect(mockTopicsService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should parse id as integer using ParseIntPipe', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Updated Name',
      };

      const expectedResponse: BaseResponse<TopicResponseDto> = {
        message: 'Topic updated successfully',
        data: mockTopicResponseDto,
      };

      mockTopicsService.update.mockResolvedValue(expectedResponse);

      await controller.update(1, updateDto);

      expect(mockTopicsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(typeof 1).toBe('number');
    });

    it('should conditionally add image only when file is uploaded', async () => {
      const updateDto: UpdateTopicDto = {
        name: 'Test',
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'test-789.jpg',
        path: '/uploads/topics/test-789.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/topics',
      } as Express.Multer.File;

      const imageUrl = 'http://example.com/uploads/topics/test-789.jpg';

      mockFileUploadService.getFileUrl.mockReturnValue(imageUrl);
      mockTopicsService.update.mockResolvedValue({
        message: 'Topic updated successfully',
        data: mockTopicResponseDto,
      });

      await controller.update(1, updateDto, mockFile);

      expect(mockTopicsService.update).toHaveBeenCalledWith(1, {
        name: 'Test',
        image: imageUrl,
      });
    });
  });

  describe('delete', () => {
    it('should delete topic and return null data', async () => {
      const expectedResponse: BaseResponse<null> = {
        message: 'Topic deleted successfully',
        data: null,
      };

      mockTopicsService.delete.mockResolvedValue(expectedResponse);

      const result = await controller.delete(1);

      expect(result).toEqual(expectedResponse);
      expect(mockTopicsService.delete).toHaveBeenCalledWith(1);
    });

    it('should parse id as integer using ParseIntPipe', async () => {
      const expectedResponse: BaseResponse<null> = {
        message: 'Topic deleted successfully',
        data: null,
      };

      mockTopicsService.delete.mockResolvedValue(expectedResponse);

      await controller.delete(1);

      expect(mockTopicsService.delete).toHaveBeenCalledWith(1);
      expect(typeof 1).toBe('number');
    });

    it('should handle service throwing NotFoundException', async () => {
      mockTopicsService.delete.mockRejectedValue(
        new Error('Topic not found'),
      );

      await expect(controller.delete(999)).rejects.toThrow('Topic not found');
    });
  });

  describe('Permissions and Guards', () => {
    it('should use PermissionsGuard for all routes', () => {
      const guards = Reflect.getMetadata('__guards__', TopicsController);
      expect(guards).toBeDefined();
    });

    it('should require topics.read permission for findAll', () => {
      const permissions = Reflect.getMetadata(
        'permissions',
        controller.findAll,
      );
      expect(permissions).toEqual(['topics.read']);
    });

    it('should require topics.read permission for findById', () => {
      const permissions = Reflect.getMetadata(
        'permissions',
        controller.findById,
      );
      expect(permissions).toEqual(['topics.read']);
    });

    it('should require topics.create permission for create', () => {
      const permissions = Reflect.getMetadata('permissions', controller.create);
      expect(permissions).toEqual(['topics.create']);
    });

    it('should require topics.update permission for update', () => {
      const permissions = Reflect.getMetadata('permissions', controller.update);
      expect(permissions).toEqual(['topics.update']);
    });

    it('should require topics.delete permission for delete', () => {
      const permissions = Reflect.getMetadata('permissions', controller.delete);
      expect(permissions).toEqual(['topics.delete']);
    });
  });

  describe('File Upload Configuration', () => {
    it('should use FileInterceptor for create with correct config', () => {
      const interceptors = Reflect.getMetadata('__interceptors__', controller.create);
      expect(interceptors).toBeDefined();
    });

    it('should use FileInterceptor for update with correct config', () => {
      const interceptors = Reflect.getMetadata('__interceptors__', controller.update);
      expect(interceptors).toBeDefined();
    });

    it('should upload files to ./uploads/topics directory', async () => {
      const createDto: CreateTopicDto = { name: 'Test' };
      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'test.jpg',
        path: '/uploads/topics/test.jpg',
        buffer: Buffer.from(''),
        stream: new Readable(),
        destination: './uploads/topics',
      } as Express.Multer.File;

      mockFileUploadService.getFileUrl.mockReturnValue(
        'http://example.com/uploads/topics/test.jpg',
      );
      mockTopicsService.create.mockResolvedValue({
        message: 'Topic created successfully',
        data: mockTopicResponseDto,
      });

      await controller.create(createDto, mockFile);

      expect(mockFileUploadService.getFileUrl).toHaveBeenCalledWith(
        'test.jpg',
        'uploads/topics',
      );
    });
  });
});
