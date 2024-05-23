import { IsDefined, IsEmail, MinLength, Validate } from 'class-validator'
import {
  MaxLengthCustom,
  PasswordComplexity,
  PasswordMatchingConstraint
} from 'common/decorators'

export class UpdateUserDto {
  @IsDefined({ message: 'Email не может быть пустым' })
  @IsEmail({}, { message: 'Некорректный Email' })
  @MaxLengthCustom(32)
  email?: string

  @IsDefined({ message: 'Пароль не может быть пустым' })
  @MinLength(6, { message: 'Минимальная длинна пароля - 6 символов' })
  @MaxLengthCustom(32)
  @Validate(PasswordComplexity, {
    message:
      'Пароль должен содержать хотя бы одну цифру, одну букву и один специальный символ(!@#$%^&*)'
  })
  password?: string

  @IsDefined({ message: 'Поле повтора пароля не может быть пустым' })
  @Validate(PasswordMatchingConstraint)
  passwordRepeat?: string
}
