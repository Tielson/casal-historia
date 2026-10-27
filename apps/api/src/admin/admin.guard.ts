import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { config } from '../config';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['x-admin-token'];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token || token !== config.adminToken) {
      throw new UnauthorizedException('Admin token inválido');
    }
    return true;
  }
}
