import { Injectable } from '@nestjs/common'
import { MailTransporter } from '@server/commands/mail.transporter'
import * as fs from 'fs'
import path from 'path'
import { EmployeeRepository } from './employee.repository'
import { UserRepository } from './user.repository'

@Injectable()
export class MailRepository {
  constructor(
    public mailTransporter: MailTransporter,
    private employeeRepo: EmployeeRepository,
    private userRepo: UserRepository,
  ) {}

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


  // Workflow mail is strictly role/assignment-based and sent only to active @puskapa.org accounts.
  // A delivery failure must never roll back a transaction that has already been saved.
  private isEligibleWorkflowEmail(email: string | null | undefined): email is string {
    return typeof email === 'string' && /^[^\s@]+@puskapa\.org$/i.test(email.trim())
  }

  private escapeWorkflowText(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private async deliverWorkflowMail(
    emails: string[],
    subject: string,
    message: string,
    url: string,
    buttonTitle = 'Open SIM PUSKAPA',
  ): Promise<void> {
    const link = url.startsWith('https://sim.puskapa.org/')
      ? url
      : 'https://sim.puskapa.org/dashboard'

    const templateValues = new Map<string, string>([
      ['{{.HEADING}}', this.escapeWorkflowText(subject)],
      ['{{.BODY}}', '<p>' + this.escapeWorkflowText(message) + '</p>'],
      ['{{.BUTTON_TITLE}}', this.escapeWorkflowText(buttonTitle)],
      ['{{.BUTTON_URL}}', link],
    ])

    for (const email of new Set(emails.map((value) => value.trim().toLowerCase()))) {
      if (!this.isEligibleWorkflowEmail(email)) continue

      try {
        await this.sendNotificationNoReply(subject, email, templateValues)
      } catch (error) {
        console.error('SIM PUSKAPA workflow email delivery failed:', email, error)
      }
    }
  }

  async sendWorkflowToEmployees(
    employeeIds: Array<string | null | undefined>,
    subject: string,
    message: string,
    url: string,
    buttonTitle?: string,
  ): Promise<void> {
    const emails: string[] = []

    for (const employeeId of new Set(employeeIds.filter((id): id is string => !!id))) {
      try {
        const employee = await this.employeeRepo.getEmployeeById(employeeId)
        if (!employee || employee.deleted_at || employee.user?.deleted_at || employee.user?.status !== true) {
          continue
        }

        if (this.isEligibleWorkflowEmail(employee.user?.email)) {
          emails.push(employee.user.email)
        }
      } catch (error) {
        console.error('SIM PUSKAPA workflow employee lookup failed:', employeeId, error)
      }
    }

    await this.deliverWorkflowMail(emails, subject, message, url, buttonTitle)
  }

  // Only for organization-wide announcements (never for pending requests or private leave details).
  async sendWorkflowToAllActiveUsers(
    subject: string,
    message: string,
    url: string,
    buttonTitle?: string,
  ): Promise<void> {
    try {
      const users = (await this.userRepo.getAllusers()) ?? []
      const emails = users
        .filter((user) => user.deleted_at === null && user.status === true)
        .map((user) => user.email)

      await this.deliverWorkflowMail(emails, subject, message, url, buttonTitle)
    } catch (error) {
      console.error('SIM PUSKAPA workflow broadcast failed:', error)
    }
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
