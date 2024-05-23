import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'
import { genSaltSync, hashSync } from 'bcrypt'
import { Cache } from 'cache-manager'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async save(user: Partial<User>) {
    const hashedPassword = user?.password
      ? this.hashPassword(user.password)
      : null
    const savedUser = this.prismaService.user
      .upsert({
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
      .catch(err => {
        this.logger.error('save user issue', err)
        return null
      })
  }

  private hashPassword(password: string) {
    return hashSync(password, genSaltSync(10))
  }

  private async clearUserCache(
    user: Partial<User | IJwtPayload>
  ): Promise<void> {
    await Promise.all([
      this.cacheManager.del(user.id),
      this.cacheManager.del(user.email)
    ]).catch(err => {
      this.logger.error('clearUserCache issue', err)
    })
  }

  private async setUserCache(
    idOrEmail?: Partial<IdOrEmail>,
    user?: Partial<User | IJwtPayload>
  ): Promise<void> {
    try {
      const ttl = convertToSecondsUtil(this.configService.get('JWT_EXP'))
      if (idOrEmail.id) {
        await this.cacheManager.set(idOrEmail.id, user, ttl)
      }
      if (idOrEmail.email) {
        await this.cacheManager.set(idOrEmail.email, user, ttl)
      }
      if (!idOrEmail.id && !idOrEmail.email && user.email) {
        await this.cacheManager.set(user.email, user, ttl)
      }
    } catch (err) {
      this.logger.error('setUserCache issue', err)
    }
  }
}
