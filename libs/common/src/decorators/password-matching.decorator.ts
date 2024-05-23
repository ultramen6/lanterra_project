import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import { RegisterUserDto } from 'src/auth/dto/register-user.dto'

@ValidatorConstraint({ name: 'IsPasswordMatching', async: false })
export class PasswordMatchingConstraint
  implements ValidatorConstraintInterface {
  validate(
    passwordRepeat: string,
    validationArguments?: ValidationArguments
  ): boolean | Promise<boolean> {
    const obj = validationArguments.object as RegisterUserDto
    return passwordRepeat === obj.password
  }
  defaultMessage(): string {
    return 'Пароли не совпадают'
  }
}
