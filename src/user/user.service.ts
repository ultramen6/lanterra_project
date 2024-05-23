import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'
import { genSaltSync, hashSync } from 'bcrypt'
import { Cache } from 'cache-manager'
import { convertToSecondsUtil } from 'common/utils'
import { IJwtPayload, IdOrEmail } from 'src/auth/interfaces'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  /**
   * Saves or updates a user in the database and caches their information.
   * If the user's password is provided, it is hashed before saving.
   * The user is either updated or created based on the presence of their email in the database.
   * After saving, the user's data is cached for quick access.
   *
   * @param {Partial<User>} user - A user object containing new or updated user data.
   * @returns {Promise<User | null>} - A promise that resolves to the saved user object or null in case of an error.
   */
  async save(user: Partial<User>): Promise<User | null> {
    const hashedPassword = user?.password
      ? this.hashPassword(user.password)
      : null
    const savedUser = await this.prismaService.user
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
    if (savedUser) {
      this.setUserCache(user)
    }
    return savedUser
  }

  private hashPassword(password: string): string {
    return hashSync(password, genSaltSync(10))
  }

  async findOne(idOrEmail: IdOrEmail, isReset = false) {
    if (isReset) {
      this.clearUserCache(idOrEmail)
    }
  }

  /**
   * Clears the user cache based on the provided identifier(s).
   * It can accept either an object with 'id' or 'email' properties, or a user object.
   * The function constructs a list of promises to delete cache entries for each provided identifier.
   * It then awaits the resolution of all promises to ensure all relevant cache entries are cleared.
   *
   * @param {IdOrEmail} idOrEmail - An object that may contain 'id' or 'email' properties.
   * @param {Partial<User | IJwtPayload>} user - A user object that may contain 'id' and 'email' properties.
   * @returns {Promise<void>} - A promise that resolves when all cache deletions are complete.
   */
  private async clearUserCache(
    idOrEmail?: IdOrEmail,
    user?: Partial<User | IJwtPayload>
  ): Promise<void> {
    try {
      const promises = []
      if (idOrEmail?.id) {
        promises.push(this.cacheManager.del(idOrEmail.id))
      }
      if (idOrEmail?.email) {
        promises.push(this.cacheManager.del(idOrEmail.email))
      }
      if (user?.id) {
        promises.push(this.cacheManager.del(user.id))
      }
      if (user?.email) {
        promises.push(this.cacheManager.del(user.email))
      }
      await Promise.all(promises)
    } catch (err) {
      this.logger.error('clearUserCache issue', err)
    }
  }

  /**
   * Sets the user cache with the provided user data.
   * It accepts either an object with 'id' or 'email' properties, or a user object.
   * The function sets cache entries for the provided identifier(s) with the user data.
   * If no 'idOrEmail' is provided, it will use the 'id' or 'email' from the user object.
   * The cache entries are set with a time-to-live (TTL) value converted from the JWT expiration configuration.
   *
   * @param {Partial<IdOrEmail>} idOrEmail - An object that may contain 'id' or 'email' properties.
   * @param {Partial<User | IJwtPayload>} user - A user object that may contain 'id' and 'email' properties.
   * @returns {Promise<void>} - A promise that resolves when the cache set operation is complete.
   */
  private async setUserCache(
    idOrEmail?: Partial<IdOrEmail>,
    user?: Partial<User | IJwtPayload>
  ): Promise<void> {
    try {
      const ttl = convertToSecondsUtil(this.configService.get('JWT_EXP'))
      if (idOrEmail?.id) {
        await this.cacheManager.set(idOrEmail.id, user, ttl)
      }
      if (idOrEmail?.email) {
        await this.cacheManager.set(idOrEmail.email, user, ttl)
      }
      if (!idOrEmail && user?.email) {
        await this.cacheManager.set(user.email, user, ttl)
      }
      if (!idOrEmail && user?.id) {
        await this.cacheManager.set(user.id, user, ttl)
      }
    } catch (err) {
      this.logger.error('setUserCache issue', err)
    }
  }
}
