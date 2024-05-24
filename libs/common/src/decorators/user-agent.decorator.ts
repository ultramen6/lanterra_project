import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { IUserAgentInfo } from 'src/auth/interfaces'

/**
 * `UserAgent` is a custom parameter decorator in NestJS that extracts user agent information from the incoming request. It provides a structured way to access the client's user agent string and IP address, which can be useful for logging, analytics, or security purposes.

 * @param _ - Unused parameter, as the decorator does not require a key.
 * @param ctx - The execution context of the request, providing access to request details.
 * @returns An object containing the user agent string and the real IP address of the client.

 * Usage:
 * In a controller method, you can use the `@UserAgent()` decorator to access the client's user agent information from the incoming request.
 * 
 * Example:
 * ```typescript
 * @Get()
 * getUserAgentInfo(@UserAgent() userAgentInfo: IUserAgentInfo) {
 *   return userAgentInfo;
 * }
 * ```
 * 
 * The decorator function extracts the `user-agent` header and the client's real IP address from the request headers. It handles common scenarios such as requests passing through a proxy, where the real IP might be included in the `x-forwarded-for` or `x-real-ip` headers.
 * 
 * This decorator enhances the functionality of NestJS controllers by allowing easy access to client-specific information without the need to manually parse request headers.
 */

export const UserAgent = createParamDecorator(
  (_: string, ctx: ExecutionContext): IUserAgentInfo => {
    const request = ctx.switchToHttp().getRequest()
    const xForwardedFor = request.headers['x-forwarded-for']
    const realIp =
      request.headers['x-real-ip'] ||
      (xForwardedFor ? xForwardedFor.split(',').pop() : undefined)
    return {
      userAgent: request.headers['user-agent'],
      userRealIp: realIp
    }
  }
)
