import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from 'class-validator'

/**
 * `IsStrongPassword` is a custom validation decorator designed to enforce strong password policies in NestJS applications. It utilizes the class-validator package to provide an easy-to-use and declarative way of validating that passwords meet specific complexity requirements.

 * @ValidatorConstraint - Marks the `PasswordComplexity` class as a custom validator, specifying its name and execution mode (synchronous in this case).
 * @param validationOptions - Optional settings for the validation operation, such as custom error messages or validation groups.
 * @returns A decorator function that can be applied to class properties to enforce strong password validation rules.

 * Usage:
 * Apply `@IsStrongPassword` to any string property within a class to enforce that the value of the property meets the defined password complexity requirements. The decorator can accept optional validation options to customize error messages or specify validation groups.
 * 
 * Example:
 * ```typescript
 * class CreateUserDto {
 *   @IsStrongPassword({
 *     message: 'Password must include at least one letter, one number, and one special character.'
 *   })
 *   password: string;
 * }
 * ```
 * 
 * The `PasswordComplexity` validator checks if the password contains at least one digit, one letter, and one special character, ensuring that passwords are strong and resistant to common types of attacks. This custom decorator enhances the security of NestJS applications by encouraging the use of strong passwords.
 */

@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class PasswordComplexity implements ValidatorConstraintInterface {
  validate(password: string): boolean | Promise<boolean> {
    return /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[\W_]).+$/.test(password)
  }

  defaultMessage(): string {
    return 'Пароль должен содержать хотя бы одну цифру, одну букву и один специальный символ'
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function(object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: PasswordComplexity
    })
  }
}
