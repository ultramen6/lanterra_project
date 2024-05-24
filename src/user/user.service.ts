import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Role, User } from '@prisma/client'
import { genSaltSync, hashSync } from 'bcrypt'
import { Cache } from 'cache-manager'
import { convertToSecondsUtil } from 'common/utils'
import { UpdateUserDto } from 'src/auth/dto/update-user.dto'
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
   * @param user - A user object containing new or updated user data.
   * @returns - A promise that resolves to the saved user object or null in case of an error.
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

  /**
   * Retrieves a user by their ID or email from the cache or the database.
   * If the 'isReset' flag is true, the user's cache will be cleared first.
   * If the user is not found in the cache, a database lookup is performed.
   * If the user is found in the database, their information is cached for future requests.
   * If the user is not found in the database, null is returned.
   *
   * @param idOrEmail - An object that may contain 'id' or 'email' properties.
   * @param isReset - A flag indicating whether to clear the user's cache before retrieval.
   * @returns - A promise that resolves to the user object if found, otherwise null.
   */
  async findOne(
    idOrEmail: Partial<IdOrEmail>,
    isReset = false
  ): Promise<User | null> {
    if (isReset) {
      await this.clearUserCache(idOrEmail)
    }
    const cachedUser = await this.cacheManager.get<User>(idOrEmail.email)
    if (!cachedUser) {
      const user = await this.prismaService.user.findFirst({
        where: {
          OR: [{ email: idOrEmail.email }, { id: idOrEmail.id }]
        }
      })
      if (!user) {
        return null
      }
      await this.setUserCache(idOrEmail, user)
      return user
    }
    return cachedUser
  }

  /**
   * Deletes a user from the database by their ID.
   * Only the user themselves or an admin can delete the user.
   * Clears the user's cache before deletion.
   * Throws a ForbiddenException if the action is not allowed.
   *
   * @param id - The ID of the user to be deleted.
   * @param user - The JWT payload of the requesting user.
   * @returns A promise that resolves to the deleted user's ID and email.
   */
  async delete(
    id: string,
    user: IJwtPayload
  ): Promise<{ id: string; email: string } | void> {
    if (!user || (user.id !== id && !user.roles.includes(Role.ADMIN))) {
      throw new ForbiddenException(
        `Нет доступа или нет такого пользователя с id: ${id}`
      )
    }

    await this.clearUserCache(user)

    return await this.prismaService.user
      .delete({
        where: { id },
        select: { id: true, email: true }
      })
      .catch(err => {
        this.logger.error('user delete issue', err)
      })
  }

  /**
   * Toggles the blocked status of a user in the database.
   * If the user is currently blocked, they will be unblocked, and vice versa.
   * Updates the user's cache after changing the blocked status.
   * Throws a ForbiddenException if the user is not found.
   *
   * @param idOrEmail - Object containing the user's ID or email.
   * @returns A promise that resolves to the updated user object with ID and blocked status.
   */
  async setBlockUnblockUser(idOrEmail: IdOrEmail): Promise<Partial<User>> {
    try {
      const userExist = await this.findOne(idOrEmail)
      const updateUser = await this.prismaService.user.update({
        where: { id: userExist.id },
        data: { isBlocked: !userExist.isBlocked },
        select: { id: true, isBlocked: true }
      })

      await this.clearUserCache(userExist)

      return updateUser
    } catch (err) {
      this.logger.error('setBlockUnblockUser issue', err)
      throw new ForbiddenException(
        `Пользователь с id: ${idOrEmail.id || idOrEmail.email} не найден`
      )
    }
  }

  /**
   * Updates the user's information in the database.
   * Only the user themselves or an admin can perform the update.
   * The user's password is hashed if it is provided in the update data.
   * The user's cache is cleared and then updated with the new information after the update.
   * Throws a BadRequestException if no update data is provided.
   * Throws a ForbiddenException if the user does not have permission to update the data.
   *
   * @param userDto - Data transfer object containing the user's updated information.
   * @param userCookie - JWT payload containing the current user's information.
   * @returns A promise that resolves to the updated user object.
   */

  async update(userDto: UpdateUserDto, userCookie: IJwtPayload): Promise<User> {
    if (!userDto) {
      throw new BadRequestException(
        'Необходимо предоставить данные для обновления'
      )
    }
    if (
      userDto.email !== userCookie.email &&
      !userCookie.roles.includes(Role.ADMIN)
    ) {
      throw new ForbiddenException(
        'У вас нет прав для выполнения этой операции'
      )
    }
    const updateData = {
      email: userDto?.email ?? undefined,
      password: userDto?.password
        ? this.hashPassword(userDto.password)
        : undefined
    }

    const updateUser = await this.prismaService.user
      .update({
        where: { email: userCookie.email },
        data: updateData
      })
      .catch(err => {
        this.logger.error('updateUser issue', err)
        throw new InternalServerErrorException('Ошибка обновления пользователя')
      })

    await this.clearUserCache(userCookie)
    await this.setUserCache(updateData)

    return updateUser
  }

  /**
   * Clears the user cache based on the provided identifier(s).
   * It can accept either an object with 'id' or 'email' properties, or a user object.
   * The function constructs a list of promises to delete cache entries for each provided identifier.
   * It then awaits the resolution of all promises to ensure all relevant cache entries are cleared.
   *
   * @param idOrEmail - An object that may contain 'id' or 'email' properties.
   * @param user - A user object that may contain 'id' and 'email' properties.
   * @returns - A promise that resolves when all cache deletions are complete.
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
   * @param idOrEmail - An object that may contain 'id' or 'email' properties.
   * @param user - A user object that may contain 'id' and 'email' properties.
   * @returns - A promise that resolves when the cache set operation is complete.
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
