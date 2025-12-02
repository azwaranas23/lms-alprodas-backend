import { Logger } from '@nestjs/common';
import { promises as fs } from 'fs';

const logger = new Logger('FileCleanupUtil');

/**
 * Cleanup uploaded files - used when operation fails
 * @param files Array of Multer files to delete
 */
export async function cleanupUploadedFiles(
  files: Express.Multer.File[],
): Promise<void> {
  for (const file of files) {
    try {
      await fs.unlink(file.path);
    } catch (error) {
      logger.warn(`Failed to delete uploaded file: ${file.path}`, error);
    }
  }
}

/**
 * Delete a single file by path
 * @param filePath Path to file to delete
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    logger.warn(`Failed to delete file: ${filePath}`, error);
  }
}

/**
 * Delete multiple files by paths
 * @param filePaths Array of file paths to delete
 */
export async function deleteFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    await deleteFile(filePath);
  }
}
