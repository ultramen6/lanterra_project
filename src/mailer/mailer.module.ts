import { Module } from '@nestjs/common'
import { AuthModule } from 'src/auth/auth.module'
import { UserModule } from 'src/user/user.module'
import { MailerService } from './mailer.service'
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer'
import { optionsMailer } from './config/mailer-config'

@Module({
	imports: [
		UserModule,
		AuthModule,
		NestMailerModule.forRootAsync(optionsMailer())
	],
	providers: [MailerService],
	exports: [MailerService]
})
export class MailerModule {}
