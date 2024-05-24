import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaModule } from './prisma/prisma.module'
import { UserService } from './user/user.service'
import { UserController } from './user/user.controller'
import { UserModule } from './user/user.module'
import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './auth/guards/jwt-auth-guard'

@Module({
  imports: [
    PrismaModule,
    UserModule,
    CacheModule.register(),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule
  ],
  providers: [
    PrismaService,
    UserService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ],
  controllers: [UserController]
})
export class AppModule { }
