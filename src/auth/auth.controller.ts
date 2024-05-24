import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Res,
  UnauthorizedException,
  UseInterceptors
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterUserDto } from './dto/register-user.dto'
import { UserResponse } from './responses/user-response'
import { LoginUserDto } from './dto/login-user.dto'
import { IUserAgentInfo } from './interfaces'
import { Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const newUser = await this.authService.register(dto)
    if (!newUser) {
      throw new BadRequestException(
        `Не удалось зарегистрировать пользователя с данными: ${JSON.stringify(dto)}. ` +
        `Попробуйте еще раз или напишите в поддержку на почту: lanterra.supp0rt@gmail.com, ` +
        `или в телеграм-бот: https://t.me/lanterra_support_official_bot`
      )
    }
    return new UserResponse(newUser)
  }

  @Post('login')
  async login(
    @Body() dto: LoginUserDto,
    @UserAgent() agent: IUserAgentInfo,
    @Res() res: Response
  ) {
    const tokens = await this.authService.login(dto, agent)
    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new BadRequestException(
        `Не удалось войти в профиль с данными: ${JSON.stringify(dto)}. ` +
        `Попробуйте еще раз или напишите в поддержку на почту: lanterra.supp0rt@gmail.com, ` +
        `или в телеграм-бот: https://t.me/lanterra_support_official_bot`
      )
    }
    this.authService.setRefreshTokenToCookie(tokens, res)
  }

  @Get('refresh-tokens')
  async refreshTokens(
    @Cookie(REFRESH_TOKEN) token: string,
    @Res() res: Response,
    @UserAgent() agent: IUserAgentInfo
  ) {
    if (!token) {
      throw new UnauthorizedException('unknow session')
    }
    const tokens = await this.authService.refreshTokens(token, agent)
    if (!tokens) {
      throw new UnauthorizedException('unknow session.')
    }
    this.authService.setRefreshTokenToCookie(tokens, res)
  }

  @Get('logout')
  logout(@Cookie(REFRESH_TOKEN) token: string, @Res() res: Response) {
    if (!token) {
      throw new UnauthorizedException('unknow session')
    }
    this.authService.deleteRefreshToken(token)
    this.authService.clearRefreshTokenFromCookie(res, true)
  }

  @Get('logout-all')
  logoutAll(@Cookie(REFRESH_TOKEN) token: string, @Res() res: Response) {
    if (!token) {
      throw new UnauthorizedException('unknow session')
    }
    this.authService.deleteAllRefreshTokens(token)
    this.authService.clearRefreshTokenFromCookie(res, false)
  }
}
