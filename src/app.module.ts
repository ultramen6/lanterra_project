import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaModule } from './prisma/prisma.module'
import { UserService } from './user/user.service'
import { UserController } from './user/user.controller'
import { UserModule } from './user/user.module'
import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    PrismaModule,
    UserModule,
    CacheModule.register(),
    ConfigModule.forRoot({ isGlobal: true })
  ],
  providers: [PrismaService, UserService],
  controllers: [UserController]
})
export class AppModule { }
