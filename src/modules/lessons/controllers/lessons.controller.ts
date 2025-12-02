import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { LessonsService } from '../services/lessons.service';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { LessonResponseDto } from '../dto/lesson-response.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';

@Controller('lessons')
@UseGuards(PermissionsGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @Permissions('lessons.read')
  async findAll(): Promise<BaseResponse<LessonResponseDto[]>> {
    return this.lessonsService.findAll();
  }

  @Get('section/:sectionId')
  @Permissions('lessons.read')
  async findBySectionId(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<BaseResponse<LessonResponseDto[]>> {
    return this.lessonsService.findBySectionId(sectionId);
  }

  @Get(':id')
  @Permissions('lessons.read')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<LessonResponseDto | null>> {
    return this.lessonsService.findById(id);
  }

  @Post()
  @Permissions('lessons.create')
  async create(
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<BaseResponse<LessonResponseDto>> {
    return this.lessonsService.create(createLessonDto);
  }

  @Patch(':id')
  @Permissions('lessons.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ): Promise<BaseResponse<LessonResponseDto>> {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @Delete(':id')
  @Permissions('lessons.delete')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<null>> {
    return this.lessonsService.delete(id);
  }
}
