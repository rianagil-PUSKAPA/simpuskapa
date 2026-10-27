import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { MailtrapClient } from 'mailtrap'

@Injectable()
export class MailTransporter implements OnModuleInit {
  public client: MailtrapClient
  constructor() {}
  async onModuleInit() {
    this.client = new MailtrapClient({
      token: process.env['MAILTRAP_TOKEN'] || '<YOUR_API_TOKEN>',
    })
  }

  async enableShutdownHooks(app: INestApplication) {}
}
