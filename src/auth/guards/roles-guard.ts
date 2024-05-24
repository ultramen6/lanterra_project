import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { ROLES_KEY } from 'common/decorators/roles.decorator'

/**
 * `RolesGuard` is a custom NestJS guard that implements role-based access control (RBAC) for route handlers. It checks if the current user has any of the roles required to access a particular route.

 * The guard uses the `Reflector` service to retrieve custom metadata defined by the `@Roles()` decorator. If no roles are required for the route (the route is not decorated with `@Roles()`), the guard grants access by default.

 * If specific roles are required, the guard retrieves the user's roles from the request object and checks if there is an overlap with the required roles. Access is granted if the user has at least one of the required roles.
 */

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass()
		])
		if (!requiredRoles) {
			return true
		}
		const { user } = context.switchToHttp().getRequest()
		return requiredRoles.some(role => user.roles?.includes(role))
	}
}
