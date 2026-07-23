import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refreshSecretKey',
      passReqToCallback: true,
    });
  }
  validate(req: Request, payload: JwtPayload) {
    const authHeader = req.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedException('Token tapılmadı ');
    }
    const refreshToken = authHeader.replace('Bearer', '').trim();
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
