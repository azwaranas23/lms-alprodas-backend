import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { BaseResponse } from '../interface/base-response.interface';
import { PRISMA_ERROR_CODES } from '../constants/app.constants';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log the error for debugging
    this.logger.error(
      `Prisma Error: ${exception.code} - ${exception.message}`,
      exception.stack,
    );

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Map Prisma error codes to HTTP status codes and messages
    switch (exception.code) {
      case PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION:
        status = HttpStatus.CONFLICT;
        message = 'A record with this data already exists';
        break;
      case PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_FAILED:
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference ID provided';
        break;
      case PRISMA_ERROR_CODES.CONSTRAINT_FAILED:
        status = HttpStatus.BAD_REQUEST;
        message = 'Constraint violation';
        break;
      case PRISMA_ERROR_CODES.RECORD_NOT_FOUND:
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case PRISMA_ERROR_CODES.INVALID_ID:
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID provided';
        break;
      case PRISMA_ERROR_CODES.REQUIRED_FIELD_MISSING:
        status = HttpStatus.BAD_REQUEST;
        message = 'Required field value is missing';
        break;
      case PRISMA_ERROR_CODES.MISSING_REQUIRED_FIELD:
        status = HttpStatus.BAD_REQUEST;
        message = 'A required field was not provided';
        break;
      case PRISMA_ERROR_CODES.TABLE_NOT_FOUND:
        status = HttpStatus.NOT_FOUND;
        message = 'Table does not exist';
        break;
      case PRISMA_ERROR_CODES.COLUMN_NOT_FOUND:
        status = HttpStatus.NOT_FOUND;
        message = 'Column does not exist';
        break;
      default:
        // For unknown Prisma errors, log more details
        this.logger.error(
          `Unhandled Prisma error code: ${exception.code}`,
          exception,
        );
    }

    const errorResponse: BaseResponse<null> = {
      message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
