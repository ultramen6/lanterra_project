import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from 'class-validator'

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
