/**
 * `JwtStrategy` is a custom authentication strategy extending the Passport JWT strategy. It validates the JWT token from incoming requests and ensures the user is not blocked and exists in the system.

 * @param payload - The JWT payload extracted from the token.
 * @returns The validated user object or throws an `UnauthorizedException` if the user cannot be authenticated.

 * The strategy is configured to extract the JWT from the authorization header and uses the secret key from the application's configuration. It leverages the `UserService` to validate the existence and status of the user associated with the JWT payload.
 */
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { UserService } from 'src/user/user.service'
import { ConfigService } from '@nestjs/config'
import { IJwtPayload } from '../interfaces'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name)

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET')
    })
  }

  async validate(payload: IJwtPayload) {
    const user = await this.userService.findOne(payload.email).catch(err => {
      this.logger.error('findOne user issue', err)
    })
    if (!user) {
      throw new UnauthorizedException('User not found or inactive')
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('User is blocked')
    }
    return user
  }
}
