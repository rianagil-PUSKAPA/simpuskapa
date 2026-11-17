import { AAR_FIELDS, AAR_STEPS, AarAnswers, aarDisplayValue, aarVisible } from '@/shared/aar.questions'

// Print Doc-style A4 PDF matching SIM PUSKAPA's orange/white visual language.
// AAR does not have an Initial / Reviewed by approval section.
type Attachment = { id: string; name: string }
const PW = 595.28
const PH = 841.89
const L = 42
const R = PW - 42
const BOTTOM = 782

const rgb = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => v.toFixed(3)).join(' ')
}

const C = {
  orange: rgb('#ff7b00'),
  orangeDark: rgb('#b95b0a'),
  pale: rgb('#fff7ef'),
  ink: rgb('#1c293f'),
  muted: rgb('#778397'),
  line: rgb('#e8ebf0'),
  white: '1 1 1',
}

const sanitize = (s: string) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(
      /[^\x20-\x7e\n]/g,
      (c) =>
        ({
          '–': '-',
          '—': '-',
          '“': '"',
          '”': '"',
          '‘': "'",
          '’': "'",
          '•': '-',
        }[c] || '?'),
    )
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const wrap = (raw: string, max = 94): string[] => {
  const lines: string[] = []

  for (const paragraph of String(raw || '-').split(/\r?\n/)) {
    let line = ''

    for (let word of paragraph.split(/\s+/)) {
      if (!word) continue

      if (line && line.length + word.length + 1 > max) {
        lines.push(line)
        line = ''
      }

      while (word.length > max) {
        if (line) {
          lines.push(line)
          line = ''
        }
        lines.push(word.slice(0, max))
        word = word.slice(max)
      }

      line = line ? line + ' ' + word : word
    }

    lines.push(line || '-')
  }

  return lines
}

// Same logo used by Payment Request Print Doc.
const AAR_LOGO_W = 336
const AAR_LOGO_H = 84
const AAR_LOGO_RGB_FLATE =
  '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'

export function buildAarPdf(answers: AarAnswers, attachments: Attachment[], submittedAt: Date): Buffer {
  const pages: string[][] = []
  let ops: string[] = []
  let y = 149

  const rect = (x: number, top: number, w: number, h: number, fill: string) => {
    ops.push(`${fill} rg ${x.toFixed(2)} ${(PH - top - h).toFixed(2)} ` + `${w.toFixed(2)} ${h.toFixed(2)} re f`)
  }

  const line = (x: number, top: number, w: number, fill = C.line) => rect(x, top, w, 0.65, fill)

  const txt = (value: string, x: number, top: number, size = 9, font: 'F1' | 'F2' | 'F3' = 'F1', fill = C.ink) => {
    ops.push(
      `BT /${font} ${size} Tf ${fill} rg 1 0 0 1 ` +
        `${x.toFixed(2)} ${(PH - top).toFixed(2)} Tm ` +
        `(${sanitize(value)}) Tj ET`,
    )
  }

  const startPage = () => {
    if (ops.length) pages.push(ops)

    ops = []

    // Header matches the white/orange Payment Request Print Doc style.
    rect(0, 0, PW, 5, C.orange)

    ops.push('q 144.00 0 0 36.00 42.00 796.89 cm /AarLogo Do Q')
    txt('SIM PUSKAPA / FORM DOCUMENT', R - 168, 27, 7.3, 'F2', C.muted)
    txt('AFTER ACTIVITY REPORT', R - 168, 40, 8.1, 'F2', C.ink)

    line(L, 51, R - L)

    rect(L, 64, R - L, 67, C.pale)
    rect(L, 64, 3.5, 67, C.orange)

    txt('After Activity Report', L + 16, 91, 20, 'F2', C.ink)
    txt('Official activity summary / Supporting documents referenced separately', L + 16, 113, 8.3, 'F1', C.muted)

    y = 158
  }

  const ensure = (height: number) => {
    if (y + height > BOTTOM) startPage()
  }

  startPage()

  const submitDate = submittedAt.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const code = answers.q22 || 'AAR'

  const metadata: Array<[string, string]> = [
    ['Activity Title', answers.q1 || '-'],
    ['Author', answers.q3 || '-'],
    ['Activity Code', code],
    ['Submitted', submitDate],
  ]

  txt('REPORT INFORMATION', L, y, 9, 'F2', C.orangeDark)
  y += 12

  for (let i = 0; i < metadata.length; i += 2) {
    const left = metadata[i]
    const right = metadata[i + 1]

    const leftLines = wrap(left[1], 43)
    const rightLines = wrap(right[1], 43)

    const height = Math.max(leftLines.length, rightLines.length) * 12 + 23

    ensure(height)

    txt(left[0], L, y + 10, 7.5, 'F1', C.muted)
    txt(right[0], L + 263, y + 10, 7.5, 'F1', C.muted)

    leftLines.forEach((s, j) => txt(s, L, y + 25 + j * 12, 9, 'F2', C.ink))

    rightLines.forEach((s, j) => txt(s, L + 263, y + 25 + j * 12, 9, 'F2', C.ink))

    line(L, y + height, 247)
    line(L + 263, y + height, 248)

    y += height + 4
  }

  y += 12

  for (const section of AAR_STEPS) {
    const fields = AAR_FIELDS.filter((f) => f.id >= section.from && f.id <= section.to && aarVisible(f, answers))

    ensure(48)

    txt(section.title.toUpperCase(), L, y + 12, 9.5, 'F2', C.orangeDark)

    line(L, y + 20, R - L, C.orange)
    y += 38

    for (const f of fields) {
      const raw = f.id === 32 ? attachments.map((a) => a.name).join(', ') || '-' : aarDisplayValue(f, answers)

      const values = wrap(raw, 97)
      const label = wrap(f.en || f.label, 95)
      const translation = f.en && f.label !== f.en ? wrap(f.label, 110) : []

      const firstHeight = label.length * 12 + translation.length * 10 + 26

      ensure(firstHeight)

      label.forEach((s, k) =>
        txt(`${k === 0 ? String(f.id).padStart(2, '0') + '   ' : '     '}${s}`, L, y + 11 + 12 * k, 9.3, 'F2', C.ink),
      )

      y += 12 + label.length * 12

      translation.forEach((s) => {
        txt(s, L + 24, y, 8.2, 'F3', C.muted)
        y += 10
      })

      y += 5

      values.forEach((s) => {
        ensure(15)
        txt(s, L + 24, y + 2, 9.3, 'F1', C.ink)
        y += 15
      })

      y += 14
      ensure(2)

      line(L, y, R - L)
      y += 14
    }

    y += 6
  }

  if (ops.length) pages.push(ops)

  // Footer without any Initial / Reviewed by box.
  for (let i = 0; i < pages.length; i++) {
    const pageOps = pages[i]

    pageOps.push(`${C.line} rg ${L.toFixed(2)} 47.00 ` + `${(R - L).toFixed(2)} 0.65 re f`)

    pageOps.push(`BT /F1 8 Tf ${C.muted} rg 1 0 0 1 ` + `${L} 32 Tm (Print Doc - SIM PUSKAPA) Tj ET`)

    pageOps.push(
      `BT /F2 8 Tf ${C.orangeDark} rg 1 0 0 1 ` + `${R - 78} 32 Tm ` + `(PAGE ${i + 1} / ${pages.length}) Tj ET`,
    )
  }

  const objects: Buffer[] = []

  const add = (raw: string | Buffer) => {
    objects.push(Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'latin1'))
    return objects.length
  }

  add('')
  add('')

  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica ' + '/Encoding /WinAnsiEncoding >>')
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold ' + '/Encoding /WinAnsiEncoding >>')
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique ' + '/Encoding /WinAnsiEncoding >>')

  const logoData = Buffer.from(AAR_LOGO_RGB_FLATE, 'base64')
  const logoObjectId = add(
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${AAR_LOGO_W} /Height ${AAR_LOGO_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${logoData.length} >>\nstream\n`,
      ),
      logoData,
      Buffer.from('\nendstream'),
    ]),
  )
  const ids: number[] = []

  for (const commands of pages) {
    const stream = Buffer.from(commands.join('\n') + '\n', 'latin1')

    const streamId = add(
      Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`), stream, Buffer.from('endstream')]),
    )

    ids.push(
      add(
        `<< /Type /Page /Parent 2 0 R ` +
          `/MediaBox [0 0 ${PW} ${PH}] ` +
          `/Resources << /Font << ` +
          `/F1 3 0 R /F2 4 0 R /F3 5 0 R ` +
          `>> /XObject << /AarLogo ${logoObjectId} 0 R >> >> /Contents ${streamId} 0 R >>`,
      ),
    )
  }

  objects[0] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>')

  objects[1] = Buffer.from(
    `<< /Type /Pages /Kids [` + ids.map((id) => id + ' 0 R').join(' ') + `] /Count ${pages.length} >>`,
  )

  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')]

  const offsets = [0]
  let position = parts[0].length

  for (let i = 0; i < objects.length; i++) {
    offsets.push(position)

    const obj = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), objects[i], Buffer.from('\nendobj\n')])

    parts.push(obj)
    position += obj.length
  }

  parts.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`))

  offsets.slice(1).forEach((n) => parts.push(Buffer.from(String(n).padStart(10, '0') + ' 00000 n \n')))

  parts.push(Buffer.from(`trailer\n<< /Size ${objects.length + 1} ` + `/Root 1 0 R >>\nstartxref\n${position}\n%%EOF`))

  return Buffer.concat(parts)
}
