import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    [key: string]: unknown;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<AuthenticatedRequest>();

    const method = req.method;
    const originalUrl = req.originalUrl || req.url;
    const userId = req.user?.id ? `[User: ${req.user.id}]` : '[Anon]';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(`${method} ${originalUrl} ${userId} +${delay}ms`);
      }),
    );
  }
}
