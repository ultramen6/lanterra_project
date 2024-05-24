import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Put,
  Res
} from '@nestjs/common'
import { UserService } from './user.service'
import { IJwtPayload, IdOrEmail } from 'src/auth/interfaces'
import { Response } from 'express'
import { UpdateUserDto } from 'src/auth/dto/update-user.dto'
import { CurrentUser } from 'common/decorators'

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name)
  constructor(private readonly userService: UserService) { }

  @Get(':idOrEmail')
  async findOne(@Param(':idOrEmail') idOrEmail: Partial<IdOrEmail>) {
    const user = await this.userService.findOne(idOrEmail).catch(err => {
      this.logger.error('findOne issue', err)
      return null
    })
    if (!user) {
      throw new BadRequestException(
        `Пользователь с id/Email: ${idOrEmail} не найден.`
      )
    }
    return user
  }

  @Delete(':id')
  async delete(
    @Param(':id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IJwtPayload
  ) {
    return await this.userService.delete(id, user)
  }

  @Put('set-block-unblock-user/:idOrEmail')
  async setBlockUnblockUser(
    @Param(':idOrEmail', ParseUUIDPipe) id: Partial<IdOrEmail>,
    @Res() res: Response
  ) {
    const blockedUser = await this.userService.setBlockUnblockUser(id)
    res.status(HttpStatus.ACCEPTED).json({
      message: `Статус блокировки пользователя с Email: ${blockedUser.email} изменен на: ${blockedUser.isBlocked}`
    })
  }

  @Put('update-user')
  async updateUser(dto: UpdateUserDto, @CurrentUser() user: IJwtPayload) {
    const updatedUser = await this.userService.update(dto, user)
    return updatedUser
  }
}
