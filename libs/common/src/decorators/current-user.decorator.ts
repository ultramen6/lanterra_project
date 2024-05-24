import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { IJwtPayload } from 'src/auth/interfaces'

/**
 * `CurrentUser` is a custom parameter decorator designed for NestJS applications to extract the currently authenticated user's information from the request object. It leverages the execution context to access the request details and optionally allows for retrieving specific properties from the user object based on the JWT payload.

 * @param key - An optional parameter specifying a particular property name from the `IJwtPayload` interface. If provided, the decorator will return the value of this property from the authenticated user's object. If omitted, the entire user object is returned.
 * @param ctx - The execution context of the current request, which provides access to the underlying request object.
 * @returns Depending on the usage, it returns either a specific property value from the user object, the entire user object, or `undefined` if the user is not authenticated or the specified key does not exist on the user object.

 * Usage:
 * - To access the entire user object: `@CurrentUser() user: IJwtPayload`
 * - To access a specific property of the user object: `@CurrentUser('email') userEmail: string`

 * Example:
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: IJwtPayload) {
 *   return user;
 * }
 *
 * @Get('email')
 * getEmail(@CurrentUser('email') email: string) {
 *   return { email };
 * }
 * ```

 * This decorator streamlines the process of accessing authenticated user information within controller methods, enhancing code readability and maintainability.
 */
export const CurrentUser = createParamDecorator(
  (
    key: keyof IJwtPayload,
    ctx: ExecutionContext
  ): IJwtPayload | Partial<IJwtPayload> => {
    const request = ctx.switchToHttp().getRequest()
    return key ? request.user?.[key] : request.user
  }
)
