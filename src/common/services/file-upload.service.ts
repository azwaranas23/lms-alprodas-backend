/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { unlink } from 'fs/promises';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import path, { basename, extname, join, resolve } from 'path';
import { Request } from 'express';

interface FileUploadOptions {
  // bisa string (static folder) atau function (dynamic folder, mis. berdasarkan courseId)
  destination:
    | string
    | ((
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void,
      ) => void);
  allowedTypes?: RegExp;
  maxSize?: number;
  allowedTypesMessage?: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  // default untuk image (avatar, thumbnail, dsb.)
  private static readonly DEFAULT_IMAGE_TYPES = /\.(jpg|jpeg|png|avif)$/i;

  // khusus untuk Course Resources
  private static readonly COURSE_RESOURCE_TYPES =
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;

  static getMulterConfig(options: FileUploadOptions) {
    const {
      destination,
      allowedTypes = this.DEFAULT_IMAGE_TYPES,
      maxSize = 5 * 1024 * 1024,
      allowedTypesMessage = 'Only image files are allowed (jpg, jpeg, png, avif)',
    } = options;

    return {
      storage: diskStorage({
        destination,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
          );
        },
      }),
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!file.originalname.match(allowedTypes)) {
          return cb(new BadRequestException(allowedTypesMessage), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: maxSize,
      },
    };
  }

  // KHUSUS AVATAR (sudah ada sebelumnya)
  static getAvatarMulterConfig() {
    return this.getMulterConfig({
      destination: './uploads/avatars',
    });
  }

  // ====== BARU: CONFIG UNTUK COURSE RESOURCES ======

  /**
   * Multer config untuk upload Course Resources
   * - disimpan di: ./uploads/resources/{courseId}
   * - ekstensi yang diizinkan: pdf, doc, docx, xls, xlsx, ppt, pptx, txt
   * - max size: 20 MB
   *
   * Digunakan di controller:
   * @UseInterceptors(FileInterceptor('file', FileUploadService.getCourseResourceMulterConfig()))
   */
  static getCourseResourceMulterConfig() {
    return this.getMulterConfig({
      destination: (req, file, cb) => {
        const courseId =
          (req.params as any).courseId ?? (req.body as any).courseId;

        const safeCourseId = String(courseId || 'unknown');
        const uploadPath = path.join('./uploads/resources', safeCourseId);

        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      allowedTypes: this.COURSE_RESOURCE_TYPES,
      maxSize: 20 * 1024 * 1024, // 20 MB
      allowedTypesMessage:
        'Only PDF, Word, Excel, PowerPoint, and Text files are allowed (pdf, doc, docx, xls, xlsx, ppt, pptx, txt)',
    });
  }

  // ====== URL HELPERS ======

  getFileUrl(filename: string, subDir: string): string {
    return `/${subDir}/${filename}`;
  }

  getAvatarUrl(filename: string): string {
    return this.getFileUrl(filename, 'uploads/avatars');
  }

  /**
   * Helper untuk membangun URL resource course.
   * Contoh: /uploads/resources/1/filename.pdf
   * (opsional digunakan di layer response / mapper)
   */
  getCourseResourceUrl(courseId: number | string, filename: string): string {
    const safeCourseId = String(courseId);
    return this.getFileUrl(`${safeCourseId}/${filename}`, 'uploads/resources');
  }

  // ====== DELETE HELPERS ======

  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      this.logger.log(`Deleted file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${filePath}`, error as any);
    }
  }

  async deleteFileByName(filename: string, uploadsDir: string): Promise<void> {
    try {
      const safeFilename = basename(filename);
      const resolvedUploadsDir = resolve(uploadsDir);
      const safePath = join(resolvedUploadsDir, safeFilename);

      if (!safePath.startsWith(resolvedUploadsDir)) {
        this.logger.error(
          `Attempted to delete file outside of uploads directory: ${safePath}`,
        );
        return;
      }

      await unlink(safePath);
      this.logger.log(`Deleted file by name: ${safePath}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${filename}`, error as any);
    }
  }

  async deleteAvatarByName(filename: string): Promise<void> {
    return this.deleteFileByName(filename, './uploads/avatars');
  }

  /**
   * Opsional: helper untuk menghapus file resource secara langsung jika path-nya diketahui.
   * Bisa dipakai nanti di CourseResourcesService saat implement delete.
   */
  async deleteCourseResourceFile(filePath: string): Promise<void> {
    return this.deleteFile(filePath);
  }
}
