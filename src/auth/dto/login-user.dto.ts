import { IsDefined, IsEmail } from 'class-validator'
import { MaxLengthCustom } from 'common/decorators'

export class LoginUserDto {
  @IsDefined({ message: 'Email не может быть пустым' })
  @IsEmail({}, { message: 'Некорректный Email' })
  @MaxLengthCustom(32)
  email: string

  @IsDefined({ message: 'Пароль не может быть пустым' })
  @MaxLengthCustom(32)
  password: string
}
