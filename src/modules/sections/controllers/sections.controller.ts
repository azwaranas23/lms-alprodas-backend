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
import { SectionsService } from '../services/sections.service';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { SectionResponseDto } from '../dto/section-response.dto';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';

@Controller('sections')
@UseGuards(PermissionsGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @Permissions('sections.read')
  async findAll(): Promise<BaseResponse<SectionResponseDto[]>> {
    return this.sectionsService.findAll();
  }

  @Get('course/:courseId')
  @Permissions('sections.read')
  async findByCourseId(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<BaseResponse<SectionResponseDto[]>> {
    return this.sectionsService.findByCourseId(courseId);
  }

  @Get(':id')
  @Permissions('sections.read')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<SectionResponseDto | null>> {
    return this.sectionsService.findById(id);
  }

  @Post()
  @Permissions('sections.create')
  async create(
    @Body() createSectionDto: CreateSectionDto,
  ): Promise<BaseResponse<SectionResponseDto>> {
    return this.sectionsService.create(createSectionDto);
  }

  @Patch(':id')
  @Permissions('sections.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectionDto: UpdateSectionDto,
  ): Promise<BaseResponse<SectionResponseDto>> {
    return this.sectionsService.update(id, updateSectionDto);
  }

  @Delete(':id')
  @Permissions('sections.delete')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<null>> {
    return this.sectionsService.delete(id);
  }
}
