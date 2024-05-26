import { MailerOptions } from '@nestjs-modules/mailer'
import { MailerAsyncOptions } from '@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface'
import { ConfigService } from '@nestjs/config'

export const mailerModuleOptions = (config: ConfigService): MailerOptions => ({
	transport: {
		service: 'gmail',
		auth: {
			user: config.get('GOOGLE_GMAIL_USER'),
			pass: config.get('GOOGLE_GMAIL_APP_PASSWORD')
		}
	}
})

export const optionsMailer = (): MailerAsyncOptions => ({
	inject: [ConfigService],
	useFactory: (config: ConfigService) => mailerModuleOptions(config)
})
