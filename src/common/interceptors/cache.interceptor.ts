import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../services/cache.service';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      'cache_key',
      context.getHandler(),
    );
    const cacheTTL = this.reflector.get<number>(
      'cache_ttl',
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const generatedKey = this.generateCacheKey(cacheKey, request);

    const cached = await this.cacheService.get(generatedKey);

    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap((response) => {
        if (response?.data) {
          this.cacheService.set(generatedKey, response, cacheTTL);
        }
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const { params, query } = request;

    return this.cacheService.generateKey(
      baseKey,
      JSON.stringify({
        params,
        query,
      }),
    );
  }
}
