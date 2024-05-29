import { MailerOptions } from '@nestjs-modules/mailer'
import { MailerAsyncOptions } from '@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface'
import { ConfigService } from '@nestjs/config'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'

export const mailerModuleOptions = (config: ConfigService): MailerOptions => ({
  transport: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.get('GOOGLE_GMAIL_USER'),
      pass: config.get('GOOGLE_GMAIL_APP_PASSWORD')
    }
  },
  defaults: {
    from: '"lanterra.ru" <lanterra.suppOrt@gmail.com>'
  },
  template: {
    dir: process.cwd() + '/src/mailer/mail-templates/email-confirm/',
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true
    }
  }
})

export const optionsMailer = (): MailerAsyncOptions => ({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => mailerModuleOptions(config)
})
