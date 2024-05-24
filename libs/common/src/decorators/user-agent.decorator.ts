import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { IUserAgentInfo } from 'src/auth/interfaces'

export const UserAgent = createParamDecorator(
  (_: string, ctx: ExecutionContext): IUserAgentInfo => {
    const request = ctx.switchToHttp().getRequest()
    const xForwardedFor = request.headers['x-forwarded-for']
    const realIp =
      request.headers['x-real-ip'] ||
      (xForwardedFor ? xForwardedFor.plit(',').pop() : undefined)
    return {
      userAgent: request.headers['user-agent'],
      userRealIp: realIp
    }
  }
)
