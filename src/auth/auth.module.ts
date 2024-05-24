import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserService } from 'src/user/user.service'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { options } from './config'

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [UserService, PassportModule, JwtModule.registerAsync(options())]
})
export class AuthModule { }
