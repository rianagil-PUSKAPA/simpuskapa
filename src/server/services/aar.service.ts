import { AarAnswers, AAR_FIELDS, aarMissing, aarProgress, aarDisplayValue, aarFieldValue } from '@/shared/aar.questions'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'
import { MailTransporter } from '@server/commands/mail.transporter'
import { buildAarPdf } from '@server/common/aar.pdf'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

export type AarAttachment = { id: string; name: string; size: number; mime: string }
type Claims = { id: string; role?: string[]; email?: string }
const TEST_RECIPIENT = 'rian.agil@puskapa.org' // TEST MODE: do not broadcast before acceptance.
const escapeHtml = (s: string): string =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

@Injectable()
export class AarService {
  constructor(private readonly db: CommonPrismaClient, private readonly mail: MailTransporter) {}

  private allowed(user: Claims, createdBy: string) {
    return createdBy === user.id || !!user.role?.some((r) => r === 'superadmin' || r === 'admin')
  }
  private async fetchOne(id: string) {
    const report = await this.db.aar_reports.findUnique({ where: { id } })
    if (!report) throw new NotFoundException('AAR tidak ditemukan')
    return report
  }
  private editable(report: { created_by: string; status: string }, user: Claims) {
    if (!this.allowed(user, report.created_by))
      throw new ForbiddenException('AAR hanya dapat diubah oleh penulis atau admin')
    if (report.status !== 'draft') throw new BadRequestException('AAR sudah disubmit dan tidak dapat diubah')
  }
  private parseAnswers(body: unknown): AarAnswers {
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new BadRequestException('Jawaban AAR tidak valid')
    const answer: AarAnswers = {}
    for (const [key, value] of Object.entries(body)) {
      if (!/^q(?:[1-9]|[12]\d|3[0-3]|102|113)$/.test(key)) continue
      if (typeof value !== 'string' || value.length > 20000)
        throw new BadRequestException('Jawaban terlalu panjang atau tidak valid: ' + key)
      answer[key] = value.trim()
    }
    return answer
  }
  private metadata(answers: AarAnswers) {
    const start = aarFieldValue(answers, 5)
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(start) && !isNaN(new Date(start + 'T00:00:00Z').getTime())
    return {
      activity_code: aarFieldValue(answers, 22).slice(0, 100) || null,
      activity_name: aarFieldValue(answers, 1).slice(0, 255) || null,
      organizer: aarFieldValue(answers, 10).slice(0, 255) || null,
      author: aarFieldValue(answers, 3).slice(0, 255) || null,
      category:
        (answers.q2 === 'Other' ? aarFieldValue(answers, 102) : aarFieldValue(answers, 2)).slice(0, 255) || null,
      start_date: validDate ? new Date(start + 'T00:00:00Z') : null,
    }
  }
  async list() {
    // Available to authenticated SIM PUSKAPA staff, like Project List.
    return this.db.aar_reports.findMany({
      select: {
        id: true,
        activity_code: true,
        activity_name: true,
        organizer: true,
        author: true,
        category: true,
        start_date: true,
        progress: true,
        status: true,
        email_status: true,
        created_at: true,
        updated_at: true,
        created_by: true,
      },
      orderBy: { updated_at: 'desc' },
      take: 500,
    })
  }
  async create(user: Claims) {
    return this.db.aar_reports.create({
      data: { created_by: user.id, answers: {}, progress: 0, status: 'draft' },
    })
  }
  async get(id: string) {
    return this.fetchOne(id)
  }
  async save(id: string, user: Claims, body: unknown) {
    const report = await this.fetchOne(id)
    this.editable(report, user)
    const answers = this.parseAnswers(body)
    // The PDF includes the current attachment metadata, stored separately.
    const result = await this.db.aar_reports.updateMany({
      where: { id, status: 'draft' },
      data: {
        answers: answers as Prisma.InputJsonValue,
        progress: aarProgress(answers),
        ...this.metadata(answers),
      },
    })
    if (!result.count) throw new BadRequestException('AAR sudah disubmit dan tidak dapat diubah')
    return this.fetchOne(id)
  }
  private filePath(id: string): string {
    return path.join(process.cwd(), 'storage', 'aar', id)
  }
  async upload(id: string, user: Claims, file: Express.Multer.File) {
    const report = await this.fetchOne(id)
    this.editable(report, user)
    if (!file || !file.buffer) throw new BadRequestException('File tidak ditemukan')
    if (file.size < 1 || file.size > 10 * 1024 * 1024) throw new BadRequestException('Ukuran file maksimum 10 MB')
    const mime = file.mimetype || 'application/octet-stream'
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]
    if (!allowed.includes(mime))
      throw new BadRequestException('Format lampiran tidak didukung (PDF, JPG, PNG, DOCX, XLSX, PPTX)')
    const attachments = (Array.isArray(report.attachments) ? report.attachments : []) as AarAttachment[]
    if (attachments.length >= 10) throw new BadRequestException('Maksimum 10 lampiran')
    const fileId = randomUUID()
    const safeName = path
      .basename(file.originalname || 'attachment')
      .replace(/[^\w.\-() ]/g, '_')
      .slice(0, 120)
    fs.mkdirSync(path.dirname(this.filePath(fileId)), { recursive: true, mode: 0o700 })
    fs.writeFileSync(this.filePath(fileId), file.buffer, { flag: 'wx', mode: 0o600 })
    const attachment = { id: fileId, name: safeName, size: file.size, mime }
    try {
      const updated = await this.db.aar_reports.updateMany({
        where: { id, status: 'draft' },
        data: { attachments: [...attachments, attachment] as unknown as Prisma.InputJsonValue },
      })
      if (!updated.count) throw new BadRequestException('AAR sudah disubmit dan tidak menerima lampiran baru')
    } catch (err) {
      fs.rmSync(this.filePath(fileId), { force: true })
      throw err
    }
    return attachment
  }
  async removeFile(id: string, fileId: string, user: Claims) {
    const report = await this.fetchOne(id)
    this.editable(report, user)
    const files = (Array.isArray(report.attachments) ? report.attachments : []) as AarAttachment[]
    const remaining = files.filter((a) => a.id !== fileId)
    if (remaining.length === files.length) throw new NotFoundException('Lampiran tidak ditemukan')
    const updated = await this.db.aar_reports.updateMany({
      where: { id, status: 'draft' },
      data: { attachments: remaining as unknown as Prisma.InputJsonValue },
    })
    if (!updated.count) throw new BadRequestException('AAR sudah disubmit dan lampiran tidak dapat dihapus')
    fs.rmSync(this.filePath(fileId), { force: true })
    return remaining
  }
  async getFile(id: string, fileId: string) {
    const report = await this.fetchOne(id)
    const files = (Array.isArray(report.attachments) ? report.attachments : []) as AarAttachment[]
    const file = files.find((a) => a.id === fileId)
    if (!file || !fs.existsSync(this.filePath(fileId))) throw new NotFoundException('Lampiran tidak ditemukan')
    return { file, content: fs.readFileSync(this.filePath(fileId)) }
  }
  async pdf(id: string) {
    const report = await this.fetchOne(id)
    if (report.status !== 'submitted') throw new BadRequestException('PDF tersedia setelah AAR disubmit')
    return buildAarPdf(
      report.answers as AarAnswers,
      (report.attachments || []) as AarAttachment[],
      report.submitted_at || new Date(),
    )
  }
  private async sendEmail(id: string) {
    const report = await this.fetchOne(id)
    if (report.status !== 'submitted') throw new BadRequestException('AAR belum disubmit')
    const update = await this.db.aar_reports.updateMany({
      where: { id, email_status: { in: ['not_sent', 'failed'] } },
      data: { email_status: 'sending', email_error: null },
    })
    if (!update.count) return this.fetchOne(id)
    const a = report.answers as AarAnswers
    const title = aarFieldValue(a, 1)
    const author = aarFieldValue(a, 3)
    const cat = report.category || '-'
    const subject =
      'AAR - ' +
      author.replace(/[\r\n]/g, ' ') +
      ' - ' +
      title.replace(/[\r\n]/g, ' ') +
      ' (' +
      cat.replace(/[\r\n]/g, ' ') +
      ')'
    const pdf = buildAarPdf(a, (report.attachments || []) as AarAttachment[], report.submitted_at || new Date())
    const link = 'https://sim.puskapa.org/dashboard/aar/' + encodeURIComponent(id) + '?preview=1'

    try {
      // Use the same notification template as other SIM PUSKAPA modules.
      // Keep the attachment and the single test recipient.
      const templatePath = path.resolve(__dirname, '../../../src/server/common/mail.notif.template.html')

      let html = fs.readFileSync(templatePath, 'utf8')

      const details = [
        ['Activity Title', title],
        ['Author', author],
        ['Category', cat],
        ['Activity Code', aarFieldValue(a, 22)],
        ['Organizer', aarFieldValue(a, 10)],
      ]

      const detailLines = details
        .map(([label, value]) => '<strong>' + escapeHtml(label) + ':</strong> ' + escapeHtml(value || '-') + '<br />')
        .join('')

      const body =
        'Dear Colleague,<br /><br />' +
        'An After Activity Report has been submitted in SIM PUSKAPA.' +
        '<br /><br />' +
        detailLines +
        '<br />' +
        'The complete AAR PDF is attached to this notification.' +
        '<br /><br />' +
        'Click the button below to open the Report Preview.'

      const substitutions = new Map<string, string>([
        ['{{.HEADING}}', 'After Activity Report - Submitted'],
        ['{{.BODY}}', body],
        ['{{.BUTTON_TITLE}}', 'Lihat AAR'],
        ['{{.BUTTON_URL}}', link],
      ])

      for (const [token, value] of substitutions) {
        if (!html.includes(token)) {
          throw new Error('Missing notification template token: ' + token)
        }
        html = html.replaceAll(token, value)
      }

      await this.mail.client.send({
        from: { email: 'notification@sim.puskapa.org', name: 'SIM PUSKAPA' },
        to: [{ email: TEST_RECIPIENT }],
        subject,
        html,
        category: 'After Activity Report',
        attachments: [
          {
            filename: ('AAR-' + (report.activity_code || id).replace(/[^a-zA-Z0-9_-]/g, '_')).slice(0, 80) + '.pdf',
            content: pdf.toString('base64'),
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
      })
      await this.db.aar_reports.update({ where: { id }, data: { email_status: 'sent', email_error: null } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mail server error'
      console.error('AAR PDF email delivery failed:', id, message)
      await this.db.aar_reports.update({
        where: { id },
        data: { email_status: 'failed', email_error: message.slice(0, 1000) },
      })
    }
    return this.fetchOne(id)
  }
  async submit(id: string, user: Claims, body: unknown) {
    const report = await this.fetchOne(id)
    this.editable(report, user)
    const answers = this.parseAnswers(body)
    const missing = aarMissing(answers)
    if (missing.length)
      throw new BadRequestException('Pertanyaan wajib belum terisi: ' + missing.map((f) => f.id).join(', '))
    if (aarFieldValue(answers, 5) > aarFieldValue(answers, 6))
      throw new BadRequestException('Tanggal selesai tidak boleh sebelum tanggal mulai')
    if (answers.q33) {
      try {
        const url = new URL(answers.q33)
        if (!['https:', 'http:'].includes(url.protocol)) throw Error('Invalid protocol')
      } catch {
        throw new BadRequestException('Tautan Materi harus URL HTTP(S) yang valid')
      }
    }
    const claimed = await this.db.aar_reports.updateMany({
      where: { id, status: 'draft' },
      data: {
        answers: answers as Prisma.InputJsonValue,
        ...this.metadata(answers),
        progress: 100,
        status: 'submitted',
        submitted_at: new Date(),
        email_status: 'not_sent',
      },
    })
    if (!claimed.count) throw new BadRequestException('AAR sudah pernah disubmit')
    return this.sendEmail(id)
  }
  async retryEmail(id: string, user: Claims) {
    const report = await this.fetchOne(id)
    if (!this.allowed(user, report.created_by)) throw new ForbiddenException('Tidak punya akses')
    if (report.status !== 'submitted' || report.email_status !== 'failed')
      throw new BadRequestException('Tidak ada email gagal yang dapat diulang')
    return this.sendEmail(id)
  }
}
