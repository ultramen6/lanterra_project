import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'
import { genSaltSync, hashSync } from 'bcrypt'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) { }

  async save(user: Partial<User>) {
    const hashedPassword = user?.password
      ? this.hashPassword(user.password)
      : null
    const savedUser = this.prismaService.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword ?? undefined,
        provider: user?.provider ?? undefined,
        roles: user?.roles ?? undefined,
        isBlocked: user?.isBlocked ?? undefined
      },
      create: {
        email: user.email,
        password: hashedPassword,
        roles: ['USER'],
        provider: user.provider
      }
    })
  }

  private hashPassword(password: string) {
    return hashSync(password, genSaltSync(10))
  }
}
