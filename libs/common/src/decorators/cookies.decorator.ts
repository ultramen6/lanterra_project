import { ExecutionContext, createParamDecorator } from '@nestjs/common'

/**
 * `Cookie` is a custom parameter decorator in NestJS that extracts cookie values from the request.
 * It allows for easy access to specific cookies or all cookies present in the request.
 *
 * @param key - The name of the cookie to retrieve. If not provided, all cookies will be returned.
 * @param ctx - The execution context of the request, providing access to request details.
 * @returns The value of the specified cookie, all cookies as an object, or `null` if the specified cookie is not found.
 *
 * Usage:
 * In a controller method, you can use the `@Cookie()` decorator to access cookies from the incoming request.
 * - To access a specific cookie: `@Cookie('cookieName') cookieValue: string`
 * - To access all cookies: `@Cookie() allCookies: Record<string, string>`
 *
 * Example:
 * ```typescript
 * @Get()
 * getCookieValue(@Cookie('sessionId') sessionId: string) {
 *   return { sessionId };
 * }
 * ```
 *
 * This decorator simplifies the process of working with cookies in a NestJS application, making it more intuitive and less error-prone.
 */
export const Cookie = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return key && key in request.cookies
      ? request.cookies[key]
      : key
        ? null
        : request.cookies
  }
)
