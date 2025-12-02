import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { unlink } from 'fs/promises';
import multer, { diskStorage } from 'multer';
import path, { basename, extname, join, resolve } from 'path';

interface FileUploadOptions {
  destination: string;
  allowedTypes?: RegExp;
  maxSize?: number;
  allowedTypesMessage?: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  static getMulterConfig(options: FileUploadOptions) {
    const {
      destination,
      allowedTypes = /\.(jpg|jpeg|png|avif)$/,
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

  static getAvatarMulterConfig() {
    return this.getMulterConfig({
      destination: './uploads/avatars',
    });
  }

  getFileUrl(filename: string, subDir: string): string {
    return `/${subDir}/${filename}`;
  }

  getAvatarUrl(filename: string): string {
    return this.getFileUrl(filename, 'uploads/avatars');
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      this.logger.log(`Deleted file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${filePath}`, error);
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
    } catch (error) {
      this.logger.error(`Error deleting file: ${filename}`, error);
    }
  }

  async deleteAvatarByName(filename: string): Promise<void> {
    return this.deleteFileByName(filename, './uploads/avatars');
  }
}
