import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from 'class-validator'

@ValidatorConstraint({ name: 'isMasLenght', async: false })
export class MaxLenghtCustomConstraint implements ValidatorConstraintInterface {
  validate(
    text: string,
    validationArguments?: ValidationArguments
  ): boolean | Promise<boolean> {
    const [maxLength] = validationArguments.constraints
    return typeof text === 'string' && text.length <= maxLength
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    const [maxLength] = validationArguments.constraints
    return `Максимальня длина = ${maxLength} символов`
  }
}

export function MaxLengthCustom(
  maxLength: number,
  validatonOptions?: ValidationOptions
) {
  return function(object: Object, propertyName: string) {
    registerDecorator({
      name: 'MaxLengthCustom',
      target: object.constructor,
      options: validatonOptions,
      constraints: [maxLength],
      propertyName: propertyName,
      validator: MaxLenghtCustomConstraint
    })
  }
}
