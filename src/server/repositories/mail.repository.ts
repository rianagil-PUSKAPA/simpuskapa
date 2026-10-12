import { Injectable } from '@nestjs/common'
import { MailTransporter } from '@server/commands/mail.transporter'
import * as fs from 'fs'
import path from 'path'

@Injectable()
export class MailRepository {
  constructor(public mailTransporter: MailTransporter) {}

  async sendNotificationNoReply(subject: string, mailTo: string, templateValues: Map<string, string>): Promise<any> {
    let templateFile = fs.readFileSync(
      path.resolve(__dirname, '../../../src/server/common/mail.notif.template.html'),
      'utf-8',
    )

    templateValues.forEach((value: string, key: string) => {
      templateFile = templateFile.replaceAll(key, value)
    })

    const sender = {
      email: 'notification@sim.puskapa.org',
      name: 'SIM PUSKAPA',
    }
    const recipients = [
      {
        email: mailTo,
      },
    ]

    const info = await this.mailTransporter.client.send({
      from: sender,
      to: recipients,
      subject: subject,
      html: templateFile,
      category: 'Notification',
    })

    console.log('Message sent: %s', info)
  }

  async sendForgotPassword(mailTo: string, temporaryPassword: string): Promise<void> {
    let templateFile = fs.readFileSync(
      path.resolve(__dirname, '../../../src/server/common/mail.notif.template.html'),
      'utf-8',
    )

    const templateValues = new Map<string, string>([
      ['{{.HEADING}}', 'Password Sementara SIM PUSKAPA'],
      [
        '{{.BODY}}',
        `
        <p>Halo,</p>
        <p>
          Kami menerima permintaan reset password untuk akun SIM PUSKAPA
          dengan email <strong>${mailTo}</strong>.
        </p>
        <p>
          Password sementara Anda adalah:
        </p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 2px;">
          ${temporaryPassword}
        </p>
        <p>
          Gunakan password sementara tersebut untuk mengganti password Anda
          pada halaman Forgot Password SIM PUSKAPA.
        </p>
        <p>
          Demi keamanan, jangan membagikan password ini kepada orang lain.
        </p>
      `,
      ],
      ['{{.BUTTON_URL}}', 'https://sim.puskapa.org/forgot-password'],
      ['{{.BUTTON_TITLE}}', 'Ganti Password'],
    ])

    templateValues.forEach((value: string, key: string) => {
      templateFile = templateFile.replaceAll(key, value)
    })

    const sender = {
      email: 'notification@sim.puskapa.org',
      name: 'SIM PUSKAPA',
    }

    const recipients = [
      {
        email: mailTo,
      },
    ]

    const info = await this.mailTransporter.client.send({
      from: sender,
      to: recipients,
      subject: 'Password Sementara SIM PUSKAPA',
      html: templateFile,
      category: 'Notification',
    })

    console.log('Forgot password email sent: %s', info)
  }
}
