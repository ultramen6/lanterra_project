import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  providers: [UserService],
  exports: [UserService],
  imports: [CacheModule.register()]
})
export class UserModule { }
