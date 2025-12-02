/**
 * Utility for handling Prisma errors with proper typing
 */
export class PrismaErrorUtil {
  /**
   * Type guard to check if an error is a Prisma error
   */
  static isPrismaError(
    error: unknown,
  ): error is { code: string; message?: string } {
    return typeof error === 'object' && error !== null && 'code' in error;
  }

  /**
   * Check if error has a specific Prisma error code
   */
  static hasErrorCode(error: unknown, code: string): boolean {
    return this.isPrismaError(error) && error.code === code;
  }
}

/**
 * Type guard for API errors with response structure
 */

export function hasErrorResponse(error: unknown): error is {
  response: {
    data: {
      error_messages: string[];
    };
  };
} {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false;
  }

  const errorWithResponse = error as { response?: unknown };
  const response = errorWithResponse.response;

  if (
    typeof response !== 'object' ||
    response === null ||
    !('data' in response)
  ) {
    return false;
  }

  const responseWithData = response as { data?: unknown };
  const data = responseWithData.data;

  if (
    typeof data !== 'object' ||
    data === null ||
    !('error_messages' in data)
  ) {
    return false;
  }

  const dataWithErrorMessages = data as { error_messages?: unknown };
  return Array.isArray(dataWithErrorMessages.error_messages);
}

/**
 * Type guard for errors with message property
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}
