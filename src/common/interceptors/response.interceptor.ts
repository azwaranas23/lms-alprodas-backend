import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { isObject, mapKeys, snakeCase } from 'lodash';
import { BaseResponse } from '../interface/base-response.interface';
import * as moment from 'moment-timezone';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'message' in data) {
          if (data.data) {
            data.data = this.transformKeysToSnakeCase(data.data);
          }
          return data;
        }

        const response: BaseResponse<any> = {
          message: 'Success',
          data: data ? this.transformKeysToSnakeCase(data) : null,
        };

        return response;
      }),
    );
  }

  private transformKeysToSnakeCase(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.transformKeysToSnakeCase(item));
    } else if (data instanceof Date) {
      return moment(data).tz('Asia/Jakarta').format();
    } else if (isObject(data) && data !== null) {
      const snakeCased = mapKeys(data, (_: any, key: string) => snakeCase(key));
      for (const key in snakeCased) {
        snakeCased[key] = this.transformKeysToSnakeCase(snakeCased[key]);
      }
      return snakeCased;
    }
    return data;
  }
}
