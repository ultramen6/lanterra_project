import { Module } from '@nestjs/common'
import { AuthModule } from 'src/auth/auth.module'
import { UserModule } from 'src/user/user.module'
import { MailerService } from './mailer.service'

@Module({
	imports: [UserModule, AuthModule],
	providers: [MailerService],
	exports: [MailerService]
})
export class MailerModule {}
