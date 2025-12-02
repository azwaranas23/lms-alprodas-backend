import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsersResponseDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
