import { Module } from '@nestjs/common'
import { MailerService } from './mailer.service'
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer'
import { optionsMailer } from './config/mailer-config'
import { options } from 'src/auth/config'
import { JwtModule } from '@nestjs/jwt'
import { MailerController } from './mailer.controller'
import { UserModule } from 'src/user/user.module'

@Module({
  controllers: [MailerController],
  imports: [
    NestMailerModule.forRootAsync(optionsMailer()),
    JwtModule.registerAsync(options()),
    UserModule
  ],
  providers: [MailerService],
  exports: [MailerService]
})
export class MailerModule { }
