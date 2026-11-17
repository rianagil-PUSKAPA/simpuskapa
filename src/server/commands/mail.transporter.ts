import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { MailtrapClient } from 'mailtrap'
import { notificationMessage } from '../../shared/app-links.cjs'

@Injectable()
export class MailTransporter implements OnModuleInit {
  public client: MailtrapClient
  constructor() {}
  async onModuleInit() {
    this.client = new MailtrapClient({
      token: process.env['MAILTRAP_TOKEN'] || '<YOUR_API_TOKEN>',
    })
    // All workflow notifications, including AAR attachments, share this transport.
    const send = this.client.send.bind(this.client)
    this.client.send = (message) => send(notificationMessage(message))
  }

  async enableShutdownHooks(app: INestApplication) {}
}
