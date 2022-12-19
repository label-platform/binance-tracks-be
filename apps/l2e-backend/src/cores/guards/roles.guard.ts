import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<string>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRole) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return this.matchRoles(user.role, requiredRole);
  }

  private matchRoles(userRoles: string, requiredRoles: string): boolean {
    if (requiredRoles === 'listener') {
      return (
        userRoles === 'listener' ||
        userRoles === 'musician' ||
        userRoles === 'admin'
      );
    } else if (requiredRoles === 'musician') {
      return userRoles === 'musician' || userRoles === 'admin';
    } else if (requiredRoles === 'admin') {
      return userRoles === 'admin';
    } else return false;
  }
}
