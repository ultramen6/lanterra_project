import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { isPublic } from 'common/decorators'
import { Observable } from 'rxjs'

/**
 * `JwtAuthGuard` is a custom guard that extends the built-in `AuthGuard` provided by `@nestjs/passport`. It incorporates additional logic to determine if a route is public or protected.

 * If a route is marked as public using the `@Public()` decorator, the guard allows the request to proceed without authentication. For protected routes, it enforces JWT authentication.

 * The guard uses the `Reflector` service to check for route-specific metadata set by the `@Public()` decorator and delegates to the default JWT authentication strategy when necessary.
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
	constructor(private readonly reflector: Reflector) {
		super()
	}

	canActivate(
		ctx: ExecutionContext
	): boolean | Promise<boolean> | Observable<boolean> {
		const _isPublic = isPublic(ctx, this.reflector)
		if (_isPublic) {
			return true
		}
		return super.canActivate(ctx)
	}
}
