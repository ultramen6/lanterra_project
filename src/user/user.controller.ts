import {
	BadRequestException,
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Logger,
	Param,
	ParseUUIDPipe,
	Put,
	Res,
	UseGuards,
	UseInterceptors
} from '@nestjs/common'
import { UserService } from './user.service'
import { IJwtPayload } from 'src/auth/interfaces'
import { Response } from 'express'
import { UpdateUserDto } from 'src/auth/dto/update-user.dto'
import { CurrentUser, Roles } from 'common/decorators'
import { RolesGuard } from 'src/auth/guards/roles-guard'
import { Role } from '@prisma/client'
import { UserResponse } from 'src/auth/responses/user-response'

@Controller('user')
export class UserController {
	private readonly logger = new Logger(UserController.name)
	constructor(private readonly userService: UserService) {}

	@UseInterceptors(ClassSerializerInterceptor)
	@Get(':idOrEmail')
	async findOne(@Param('idOrEmail') idOrEmail: string) {
		const user = await this.userService.findOne(idOrEmail)
		if (!user) {
			throw new BadRequestException(
				`Пользователь с id/email: ${idOrEmail} не найден.`
			)
		}
		return new UserResponse(user)
	}

	@Delete(':id')
	async delete(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUser() user: IJwtPayload
	) {
		return await this.userService.delete(id, user)
	}

	@UseGuards(RolesGuard)
	@Roles(Role.ADMIN)
	@Put('set-block-unblock-user/:idOrEmail')
	async setBlockUnblockUser(
		@Param('idOrEmail') idOrEmail: string,
		@Res() res: Response
	) {
		const blockedUser = await this.userService.setBlockUnblockUser(idOrEmail)
		res.status(HttpStatus.ACCEPTED).json({
			message: `Статус блокировки пользователя с Email: ${blockedUser.email} изменен на: ${blockedUser.isBlocked}`
		})
	}

	@UseInterceptors(ClassSerializerInterceptor)
	@Put('update-user')
	async updateUser(
		@Body() dto: UpdateUserDto,
		@CurrentUser() user: IJwtPayload
	) {
		const updatedUser = await this.userService.update(dto, user)
		return new UserResponse(updatedUser)
	}
}
