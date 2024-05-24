import { $Enums, User } from '@prisma/client'
import { Exclude } from 'class-transformer'

export class UserResponse implements User {
  id: string
  email: string

  @Exclude()
  password: string
  createAt: Date
  updateAt: Date
  roles: $Enums.Role[]
  provider: $Enums.Provider
  isBlocked: boolean

  constructor(user: User) {
    Object.assign(this, user)
  }
}
