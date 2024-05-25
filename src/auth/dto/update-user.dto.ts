import { UseGuards } from '@nestjs/common'
import {
	IsDefined,
	IsEmail,
	IsOptional,
	MinLength,
	Validate
} from 'class-validator'
import {
	MaxLengthCustom,
	PasswordComplexity,
	PasswordMatchingConstraint
} from 'common/decorators'

export class UpdateUserDto {
	@IsDefined()
	@IsEmail({}, { message: 'Некорректный Email' })
	@MaxLengthCustom(32)
	email?: string

	@IsOptional()
	@MinLength(6, { message: 'Минимальная длинна пароля - 6 символов' })
	@MaxLengthCustom(32)
	@Validate(PasswordComplexity, {
		message:
			'Пароль должен содержать хотя бы одну цифру, одну букву и один специальный символ(!@#$%^&*)'
	})
	password?: string

	@IsOptional()
	@Validate(PasswordMatchingConstraint)
	passwordRepeat?: string

	@IsOptional()
	@IsEmail()
	changeUserEmail?: string
}
