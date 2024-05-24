import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import { RegisterUserDto } from 'src/auth/dto/register-user.dto'

/**
 * `IsPasswordMatching` is a custom validation decorator that ensures the confirmation password matches the original password. It is particularly useful in user registration workflows where password confirmation is required.

 * @ValidatorConstraint - Decorates the `PasswordMatchingConstraint` class as a custom validator, specifying its unique name and synchronous execution.
 * @returns A boolean indicating whether the password confirmation matches the original password.

 * Usage:
 * The `PasswordMatchingConstraint` can be applied to a password confirmation field in a DTO to validate that it matches the original password field.
 * 
 * Example:
 * ```typescript
 * class RegisterUserDto {
 *   password: string;
 * 
 *   @IsPasswordMatching()
 *   confirmPassword: string;
 * }
 * ```
 * 
 * The `validate` method compares the `passwordRepeat` value with the `password` value from the `RegisterUserDto` object. If they match, the validation passes; otherwise, it fails, and the `defaultMessage` is returned, indicating that the passwords do not match.
 * 
 * This custom validator enhances the robustness of the registration process by preventing user errors related to password mismatch.
 */

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
