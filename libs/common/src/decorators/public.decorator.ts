import { ExecutionContext, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

/**
 * `Public` is a custom decorator that marks a route handler or controller as public, bypassing any global guards that require authentication or authorization. It utilizes NestJS's metadata storage capabilities to flag routes for special treatment.

 * @returns A decorator function that applies metadata to the route handler or controller, indicating that it should be publicly accessible.

 * Usage:
 * Apply the `@Public()` decorator to any controller method to make it publicly accessible without requiring authentication.
 * 
 * Example:
 * ```typescript
 * @Controller('users')
/**
 * `Public` is a custom decorator that marks a route handler or controller as public, bypassing any global guards that require authentication or authorization. It utilizes NestJS's metadata storage capabilities to flag routes for special treatment.

 * @returns A decorator function that applies metadata to the route handler or controller, indicating that it should be publicly accessible.

 * Usage:
 * Apply the `@Public()` decorator to any controller method to make it publicly accessible without requiring authentication.
 * 
 * Example:
 * ```typescript
 * @Controller('users')
 * export class UsersController {
 *   @Public()
 *   @Get('profile')
 *   getPublicProfile() {
 *     // This route can be accessed without authentication
 *   }
 * }
 * ```
 * 
 * The `isPublic` function is a helper that determines whether a given route is public by checking the metadata set by the `@Public()` decorator. It uses the `Reflector` service provided by NestJS to access the metadata.
 * 
 * This combination of a custom decorator and helper function allows for fine-grained control over route accessibility, making it easy to expose certain routes as public while keeping others protected.
 */
export const PUBLIC_KEY = 'public'
export const Public = () => SetMetadata(PUBLIC_KEY, true)

export const isPublic = (ctx: ExecutionContext, reflector: Reflector) => {
  const isPublic = reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
    ctx.getHandler(),
    ctx.getClass()
  ])
  return isPublic
}
