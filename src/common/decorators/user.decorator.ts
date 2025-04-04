import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUser } from 'src/core/types/iuser.type';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
