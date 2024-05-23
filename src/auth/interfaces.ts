import { Token } from '@prisma/client'

export interface ITokens {
  accessToken: string
  refreshToken: Token
}

export interface IUserAgentInfo {
  userAgent: string
  userRealIp: string
}

export interface IJwtPayload {
  id: string
  email: string
  roles: string[]
}

export interface IdOrEmail {
  id?: string
  email?: string
}
