import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'accessSecretKey',
    });
  }
  validate(payload: JwtPayload) {
    if (!payload) {
      throw new UnauthorizedException('Etibarsız Token!');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
