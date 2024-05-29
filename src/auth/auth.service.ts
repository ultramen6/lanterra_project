import {
	ConflictException,
	ForbiddenException,
	HttpStatus,
	Injectable,
	Logger,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserService } from 'src/user/user.service'
import { RegisterUserDto } from './dto/register-user.dto'
import { LoginUserDto } from './dto/login-user.dto'
import { ITokens, IUserAgentInfo } from './interfaces'
import { Token, User } from '@prisma/client'
import { compareSync } from 'bcrypt'
import { v4 } from 'uuid'
import { generateExpConfig } from 'common/utils/generate-exp-config.util'
import { Response } from 'express'
import { MailerService } from 'src/mailer/mailer.service'

export const REFRESH_TOKEN = 'refreshtoken'

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name)
	constructor(
		private readonly prismaService: PrismaService,
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly mailerService: MailerService
	) { }

	/**
	 * Registers a new user in the system.
	 *
	 * This method checks if a user with the given email already exists. If so, it throws a conflict exception. Otherwise, it creates a new user record with the provided details.
	 *
	 * @param dto - Data Transfer Object containing the new user's registration information.
	 * @returns The newly created user object.
	 * @throws ConflictException if a user with the same email already exists.
	 */
	async register(dto: RegisterUserDto) {
		const user = await this.userService.findOne(dto.email).catch(err => {
			this.logger.error('register findOne issue', err)
			return null
		})
		if (user) {
			throw new ConflictException(
				`Пользователь с Email: ${dto.email} уже существует`
			)
		}
		const newUser = await this.userService.save(dto)
		await this.mailerService.sendEmailPasswordConfirmation(newUser)
		return newUser
	}

	/**
	 * Authenticates a user and generates authentication tokens.
	 *
	 * This method verifies the user's credentials, checks if the user is not blocked, and then generates access and refresh tokens.
	 *
	 * @param dto - Data Transfer Object containing the user's login credentials.
	 * @param agent - Object containing user agent information for the request.
	 * @returns A promise that resolves to an object containing the access and refresh tokens.
	 * @throws UnauthorizedException if the credentials are invalid or if the user is blocked.
	 */
	async login(dto: LoginUserDto, agent: IUserAgentInfo): Promise<ITokens> {
		const userExist: User = await this.userService
			.findOne(dto.email)
			.catch(err => {
				this.logger.error('login findOne issue', err)
				return null
			})
		if (!userExist || !compareSync(dto.password, userExist.password)) {
			throw new UnauthorizedException('Не существующий Email или пароль')
		}
		if (userExist.isBlocked) {
			throw new UnauthorizedException(
				`Аккаунт с Email: ${dto.email} - заблокирован!`
			)
		}
		return await this.generateTokens(userExist, agent)
	}

	/**
	 * Generates access and refresh tokens for the authenticated user.
	 *
	 * This method creates a JWT access token and a refresh token for the user. The access token includes the user's ID, email, and roles.
	 *
	 * @param user - The user entity for which to generate the tokens.
	 * @param agent - Object containing user agent information for the request.
	 * @returns A promise that resolves to an object containing the access and refresh tokens.
	 * @throws An error if token generation fails.
	 */
	private async generateTokens(
		user: User,
		agent: IUserAgentInfo
	): Promise<ITokens> {
		try {
			const accessToken =
				'Bearer ' +
				this.jwtService.sign({
					id: user.id,
					email: user.email,
					roles: user.roles
				})
			const refreshToken = await this.genRefreshToken(user.id, agent)
			return { accessToken, refreshToken }
		} catch (err) {
			this.logger.error('tokens issue', err)
		}
	}

	/**
	 * Generates or updates a refresh token for the user.
	 *
	 * This method either creates a new refresh token or updates the existing one for the user based on their ID and user agent information. It uses UUID v4 to generate a unique token and sets an expiration time based on the application's configuration.
	 *
	 * @param userId - The ID of the user for whom to generate the refresh token.
	 * @param agent - Object containing user agent information for the request.
	 * @returns A promise that resolves to the refresh token entity.
	 * @throws An error if the refresh token generation or update fails.
	 */
	private async genRefreshToken(
		userId: string,
		agent: IUserAgentInfo
	): Promise<Token> {
		try {
			const _token = await this.prismaService.token.findFirst({
				where: {
					userId,
					userAgent: agent.userAgent,
					userRealIp: agent.userRealIp
				}
			})

			const token = _token?.token ?? ''

			return await this.prismaService.token.upsert({
				where: { token },
				update: {
					token: v4(),
					exp: generateExpConfig(this.configService.get('JWT_EXP'))
				},
				create: {
					token: v4(),
					exp: generateExpConfig(this.configService.get('JWT_EXP')),
					userAgent: agent.userAgent,
					userRealIp: agent.userRealIp,
					userId
				}
			})
		} catch (err) {
			this.logger.error('genRefreshToken issue', err)
		}
	}

	/**
	 * Sets the refresh token in an HTTP-only cookie on the response object.
	 *
	 * This method takes a refresh token and the response object, then sets the refresh token as an HTTP-only cookie. This helps prevent XSS attacks by not exposing the token to client-side JavaScript. It also sets the cookie's security settings based on the application's environment.
	 *
	 * @param token - An object containing the refresh token to be set in the cookie.
	 * @param res - The response object to which the cookie will be attached.
	 * @throws UnauthorizedException if the token is not provided.
	 */
	setRefreshTokenToCookie(token: ITokens, res: Response) {
		if (!token) {
			throw new UnauthorizedException()
		}
		res.cookie(REFRESH_TOKEN, token.refreshToken.token, {
			httpOnly: true,
			sameSite: 'lax',
			secure: this.configService.get('SECURE_COOKIE', 'dev') === 'prod',
			path: '/'
		})
		res.status(HttpStatus.OK).json({ message: token.accessToken })
	}

	/**
	 * Refreshes the authentication tokens for a user based on the provided refresh token.
	 *
	 * This method validates the provided refresh token, deletes it from the database, and generates new access and refresh tokens if the token is valid and the user is not blocked.
	 *
	 * @param refreshToken - The refresh token to be validated and refreshed.
	 * @param agent - Object containing user agent information for the request.
	 * @returns A promise that resolves to an object containing the new access and refresh tokens.
	 * @throws UnauthorizedException if the refresh token is invalid, expired, or the user is blocked.
	 */
	async refreshTokens(refreshToken: string, agent: IUserAgentInfo) {
		try {
			const _token = await this.prismaService.token
				.delete({
					where: { token: refreshToken }
				})
				.catch(err => {
					this.logger.error('refreshToken delete issue', err)
				})
			if (!_token || new Date(_token.exp) < new Date()) {
				throw new UnauthorizedException()
			}
			const user = await this.userService.findOne(_token.userId).catch(err => {
				this.logger.error('refreshToken userFindOne issue', err)
				throw new ForbiddenException('UserId не найден')
			})
			if (user.isBlocked) {
				throw new UnauthorizedException(
					`Аккаунт с Email: ${user.email} - заблокирован!`
				)
			}
			return await this.generateTokens(user, agent)
		} catch (err) {
			this.logger.error(
				'delete issue for refreshTokens from DB. It possible that table.tokens was empty'
			)
			throw new UnauthorizedException()
		}
	}

	/**
	 * Deletes a refresh token from the database.
	 *
	 * This method attempts to delete a refresh token specified by the `token` parameter. It uses the `deleteMany` method to ensure all instances of the token are removed. If the token cannot be found or an error occurs during deletion, it logs the error and may throw an `UnauthorizedException`.
	 *
	 * @param token - The refresh token to be deleted.
	 * @throws UnauthorizedException if the token does not exist or cannot be deleted.
	 */
	async deleteRefreshToken(token: string) {
		const _token = await this.prismaService.token
			.deleteMany({
				where: { token: token }
			})
			.catch(err => {
				this.logger.error('delete token issue', err)
				return null
			})
		if (!_token || _token.count === 0) {
			throw new UnauthorizedException()
		}
	}

	/**
	 * Deletes all refresh tokens associated with a user.
	 *
	 * This method first retrieves the user ID associated with the provided refresh token. It then attempts to delete all refresh tokens for that user from the database. If no tokens are deleted or an error occurs, it logs the error and throws an `UnauthorizedException`.
	 *
	 * @param token - The refresh token used to identify the user whose tokens are to be deleted.
	 * @throws UnauthorizedException if no tokens are found or deleted for the user.
	 */
	async deleteAllRefreshTokens(token: string) {
		const userId = await this.getUserIdFromRefreshToken(token)
		const _token = await this.prismaService.token
			.deleteMany({
				where: { userId: userId }
			})
			.catch(err => {
				this.logger.error('delete token by userid issue', err)
				return null
			})
		if (!_token || _token.count === 0) {
			throw new UnauthorizedException()
		}
	}

	/**
	 * Retrieves the user ID associated with a given refresh token.
	 *
	 * This method queries the database for a refresh token and extracts the user ID associated with it. If the token is not found or an error occurs during the query, it logs the error and may return `null` or throw a `ForbiddenException`.
	 *
	 * @param refreshToken - The refresh token used to identify the user.
	 * @returns The user ID associated with the refresh token, or `null` if an error occurs.
	 * @throws ForbiddenException if the user ID cannot be found.
	 */
	private async getUserIdFromRefreshToken(
		refreshToken: string
	): Promise<string | null> {
		const { userId } = await this.prismaService.token
			.findUnique({
				where: { token: refreshToken },
				select: { userId: true }
			})
			.catch(err => {
				this.logger.error('getUserId issue', err)
				return null
			})
		if (!userId) {
			throw new ForbiddenException('User ID not found')
		}
		return userId
	}

	/**
	 * Clears the refresh token from the HTTP-only cookie in the response object.
	 *
	 * This method sets the refresh token cookie to an empty string with an immediate expiration date, effectively clearing it. It also sets the appropriate response message based on the logout type.
	 *
	 * @param res - The response object to which the cookie will be attached.
	 * @param logoutType - A boolean indicating the type of logout (single device or all devices).
	 * @returns The response object with the appropriate status and message.
	 */
	clearRefreshTokenFromCookie(res: Response, logoutType: boolean) {
		res.cookie(REFRESH_TOKEN, '', {
			httpOnly: true,
			secure: this.configService.get('SECURE_COOKIE', 'dev') === 'prod',
			path: '/',
			expires: new Date()
		})
		if (logoutType) {
			return res.status(HttpStatus.OK).json({ message: 'Вы вышли из аккаунта' })
		}
		return res
			.status(HttpStatus.OK)
			.json({ message: 'Вы вышли из аккаунта на всех устройствах' })
	}
}
