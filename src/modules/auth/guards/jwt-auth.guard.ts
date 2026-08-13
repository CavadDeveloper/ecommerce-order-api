import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    console.log('========== JWT GUARD ==========');
    console.log('Authorization header:', req.headers.authorization);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('JWT ERROR:', err);
    console.log('JWT INFO:', info);
    console.log('JWT USER:', user);

    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(info?.message || 'JWT authentication failed')
      );
    }

    return user;
  }
}
