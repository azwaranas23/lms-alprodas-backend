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
import { SubjectsService } from '../services/subjects.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { SubjectsResponseDto } from '../dto/subjects-response.dto';
import { QuerySubjectsDto } from '../dto/query-subjects.dto';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('subjects')
@UseGuards(PermissionsGuard)
export class SubjectsController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  @Permissions('subjects.read')
  async findAll(
    @Query() query: QuerySubjectsDto,
  ): Promise<BaseResponse<PaginatedResponse<SubjectsResponseDto>>> {
    return this.subjectsService.findAll(query);
  }

  @Get(':id')
  @Permissions('subjects.read')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<SubjectsResponseDto | null>> {
    return this.subjectsService.findById(id);
  }

  @Post()
  @Permissions('subjects.create')
  @UseInterceptors(
    FileInterceptor(
      'image',
      FileUploadService.getMulterConfig({
        destination: './uploads/subjects',
      }),
    ),
  )
  async create(
    @Body() createSubjectDto: CreateSubjectDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<BaseResponse<SubjectsResponseDto>> {
    const imageUrl = imageFile
      ? this.fileUploadService.getFileUrl(
          imageFile.filename,
          'uploads/subjects',
        )
      : undefined;

    const subjectData = {
      ...createSubjectDto,
      image: imageUrl,
    };

    return this.subjectsService.create(subjectData);
  }

  @Patch(':id')
  @Permissions('subjects.update')
  @UseInterceptors(
    FileInterceptor(
      'image',
      FileUploadService.getMulterConfig({
        destination: './uploads/subjects',
      }),
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: CreateSubjectDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<BaseResponse<SubjectsResponseDto>> {
    const imageUrl = imageFile
      ? this.fileUploadService.getFileUrl(
          imageFile.filename,
          'uploads/subjects',
        )
      : undefined;

    const subjectData = {
      ...updateSubjectDto,
      ...(imageUrl && { image: imageUrl }),
    };

    return this.subjectsService.update(id, subjectData);
  }

  @Delete(':id')
  @Permissions('subjects.delete')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<null>> {
    return this.subjectsService.delete(id);
  }
}
