import { Global, Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { options } from './config'
import { STRATEGIES } from './strategies'
import { GUARDS } from './guards'
import { UserModule } from 'src/user/user.module'
import { MailerModule } from 'src/mailer/mailer.module'

@Module({
  controllers: [AuthController],
  providers: [AuthService, ...STRATEGIES, ...GUARDS],
  imports: [
    UserModule,
    PassportModule,
    MailerModule,
    JwtModule.registerAsync(options())
  ],
  exports: [AuthService]
})
export class AuthModule { }
