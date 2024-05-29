import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { MailerService } from './mailer.service'
import { Public } from 'common/decorators'
import { UserService } from 'src/user/user.service'

@Controller('mailer')
export class MailerController {
  constructor(
    private readonly mailerService: MailerService,
    private readonly userService: UserService
  ) { }

  @Public()
  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Токен не предоставлен' })
    }

    try {
      const verifiedToken = await this.mailerService.compareMailToken(token)
      if (verifiedToken.isValid) {
        this.userService.save(verifiedToken.user, true)
        return res.status(HttpStatus.OK).json({ message: 'Email подтвержден' })
      } else {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'Неверный токен' })
      }
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Ошибка сервера' })
    }
  }
}
