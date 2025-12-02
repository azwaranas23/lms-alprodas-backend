import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TopicsService } from '../services/topics.service';
import { QueryTopicsDto } from '../dto/query-topics.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { TopicResponseDto } from '../dto/topic-response.dto';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';

@Controller('topics')
@UseGuards(PermissionsGuard)
export class TopicsController {
  constructor(
    private readonly topicsService: TopicsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  @Permissions('topics.read')
  async findAll(
    @Query() query: QueryTopicsDto,
  ): Promise<BaseResponse<PaginatedResponse<TopicResponseDto>>> {
    return this.topicsService.findAll(query);
  }

  @Get(':id')
  @Permissions('topics.read')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<TopicResponseDto> | null> {
    return this.topicsService.findById(id);
  }

  @Post()
  @Permissions('topics.create')
  @UseInterceptors(
    FileInterceptor(
      'image',
      FileUploadService.getMulterConfig({ destination: './uploads/topics' }),
    ),
  )
  async create(
    @Body() createTopicDto: CreateTopicDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<BaseResponse<TopicResponseDto>> {
    const imageUrl = imageFile
      ? this.fileUploadService.getFileUrl(imageFile.filename, 'uploads/topics')
      : undefined;

    const topicData = { ...createTopicDto, image: imageUrl };

    const result = await this.topicsService.create(topicData);
    return result;
  }

  @Patch(':id')
  @Permissions('topics.update')
  @UseInterceptors(
    FileInterceptor(
      'image',
      FileUploadService.getMulterConfig({ destination: './uploads/topics' }),
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<BaseResponse<TopicResponseDto>> {
    const imageUrl = imageFile
      ? this.fileUploadService.getFileUrl(imageFile.filename, 'uploads/topics')
      : undefined;

    const topicData = {
      ...updateTopicDto,
      ...(imageUrl && { image: imageUrl }),
    };

    return await this.topicsService.update(id, topicData);
  }

  @Delete(':id')
  @Permissions('topics.delete')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<null>> {
    return this.topicsService.delete(id);
  }
}
