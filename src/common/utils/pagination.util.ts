import {
  PaginatedResponse,
  PaginationMeta,
} from '../interface/pagination.interface';

export class PaginationUtil {
  static createMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  static createResponse<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    return {
      items,
      meta: this.createMeta(page, limit, total),
    };
  }
}
