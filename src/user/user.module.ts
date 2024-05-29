import { Global, Module } from '@nestjs/common'
import { UserService } from './user.service'
import { CacheModule } from '@nestjs/cache-manager'
import { MailerModule } from 'src/mailer/mailer.module'

@Module({
  providers: [UserService],
  exports: [UserService],
  imports: [CacheModule.register()]
})
export class UserModule { }
