import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from 'class-validator'

/**
 * `MaxLengthCustom` is a custom decorator for class-validator package in NestJS applications, designed to validate that a string property of a class does not exceed a specified maximum length. It provides a more customizable approach to the standard `@MaxLength` decorator by allowing custom validation messages.

 * @ValidatorConstraint - Decorates the `MaxLenghtCustomConstraint` class as a custom validator constraint with a specified name and synchronicity option.
 * @param maxLength - The maximum allowed length for the string.
 * @param validationOptions - Optional settings for the validation operation, such as custom error messages or groups.
 * @returns A decorator function that can be applied to class properties to enforce their maximum length constraint.

 * Usage:
 * Apply `@MaxLengthCustom` to any string property within a class to enforce a maximum length validation rule. The first parameter specifies the maximum length, and the second parameter allows for custom validation options.
 * 
 * Example:
 * ```typescript
 * class UserProfile {
 *   @MaxLengthCustom(10, {
 *     message: 'Username must be 10 characters or fewer.'
 *   })
 *   username: string;
 * }
 * ```
 * 
 * This custom decorator enhances the flexibility and user-friendliness of validation messages in NestJS applications, providing developers with the ability to specify detailed and context-specific error messages for validation rules.
 */

export function MaxLengthCustom(
  maxLength: number,
  validationOptions?: ValidationOptions
) {
  return function(object: Object, propertyName: string) {
    registerDecorator({
      name: 'MaxLengthCustom',
      target: object.constructor,
      options: validationOptions,
      constraints: [maxLength],
      propertyName: propertyName,
      validator: MaxLengthCustomConstraint
    })
  }
}

@ValidatorConstraint({ name: 'isMaxLength', async: false })
export class MaxLengthCustomConstraint implements ValidatorConstraintInterface {
  validate(
    text: string,
    validationArguments?: ValidationArguments
  ): boolean | Promise<boolean> {
    const [maxLength] = validationArguments.constraints
    return typeof text === 'string' && text.length <= maxLength
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    const [maxLength] = validationArguments.constraints
    return `Максимальная длина = ${maxLength} символов`
  }
}
