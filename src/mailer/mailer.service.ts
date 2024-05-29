import {
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { MailerService as MailerSendEmailService } from '@nestjs-modules/mailer'
import { UserService } from 'src/user/user.service'

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailerSendEmailService: MailerSendEmailService,
    private readonly userService: UserService
  ) { }

  async sendEmailPasswordConfirmation(user: User) {
    const token = await this.genMailToken(user)
    const url = `http://localhost/api/mailer/confirm-email/?token=${token}`

    try {
      await this.mailerSendEmailService.sendMail({
        to: user.email,
        subject: 'Подтверждение почтового адреса для портала lanterra.ru',
        template: 'email-confirm',
        context: {
          token,
          url
        }
      })
    } catch (err) {
      this.logger.error('email send issue', err)
    }
  }

  private async genMailToken(user: User): Promise<string> {
    try {
      const mailJwtToken = this.jwtService.sign({
        id: user.id,
        email: user.email
      })

      return mailJwtToken
    } catch (err) {
      this.logger.error('genMailToken issue', err)
      throw new InternalServerErrorException('Generate token issue')
    }
  }

  async compareMailToken(
    token: string
  ): Promise<{ isValid: boolean; user?: Partial<User> }> {
    try {
      const decoded = this.jwtService.verify(token)
      if (!decoded) {
        throw new Error('Невозможно расшифровать токен.')
      }
      const user = await this.userService.findOne(decoded.id)
      if (user && user.id === decoded.id && user.email === decoded.email) {
        return { isValid: true, user }
      }
      return { isValid: false }
    } catch (err) {
      this.logger.error('compareToken with user issue', err)
      return { isValid: false }
    }
  }
}
