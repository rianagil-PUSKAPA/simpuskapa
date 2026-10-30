import { AAR_FIELDS, AAR_STEPS, AarAnswers, aarDisplayValue, aarVisible } from '@/shared/aar.questions'

// Self-contained vector PDF: no browser process, external PDF service, or new dependency.
type Attachment = { id: string; name: string }
const PAGE_W = 595.28
const PAGE_H = 841.89
const LEFT = 48
const RIGHT = PAGE_W - 48
const MAX_Y = 771
const pdfText = (value: string): string =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e\n]/g, (c) => ({ '–': '-', '—': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '•': '-' }[c] || '?'))
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
const color = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    .map((v) => v.toFixed(3)).join(' ')
}
const C = { navy: color('#18284c'), violet: color('#6756d9'), soft: color('#f0efff'), ink: color('#25324e'), muted: color('#758198'), line: color('#e7ebf4'), white: '1 1 1', mint: color('#45d8c3') }

function wrap(value: string, max = 92): string[] {
  const result: string[] = []
  for (const line of String(value || '-').split(/\r?\n/)) {
    let current = ''
    for (let word of line.split(/\s+/)) {
      if (!word) continue
      if ((current + ' ' + word).length > max && current) {
        result.push(current)
        current = ''
      }
      while (word.length > max) {
        if (current) { result.push(current); current = '' }
        result.push(word.slice(0, max))
        word = word.slice(max)
      }
      current = current ? current + ' ' + word : word
    }
    result.push(current || '-')
  }
  return result
}

export function buildAarPdf(answers: AarAnswers, attachments: Attachment[], submittedAt: Date): Buffer {
  const pages: string[][] = []
  let ops: string[] = []
  let y = 48
  const rect = (x: number, top: number, w: number, h: number, fill: string) => {
    ops.push(fill + ' rg ' + x.toFixed(2) + ' ' + (PAGE_H - top - h).toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re f')
  }
  const text = (value: string, x: number, top: number, size = 10, bold = false, fill = C.ink) => {
    ops.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + fill + ' rg 1 0 0 1 ' + x.toFixed(2) + ' ' + (PAGE_H - top).toFixed(2) + ' Tm (' + pdfText(value) + ') Tj ET')
  }
  const newPage = (continuation = false) => {
    if (ops.length) pages.push(ops)
    ops = []
    y = continuation ? 83 : 191
    rect(0, 0, PAGE_W, continuation ? 65 : 156, C.navy)
    rect(0, 0, 9, continuation ? 65 : 156, C.violet)
    if (continuation) {
      text('PUSKAPA  /  AFTER ACTIVITY REPORT', LEFT, 32, 12, true, C.white)
      text('CONTINUED', RIGHT - 75, 32, 9, true, C.mint)
    } else {
      text('P U S K A P A    /    OFFICIAL ACTIVITY REPORT', LEFT, 36, 10, true, C.mint)
      text('After Activity', LEFT, 77, 25, true, C.white)
      text('Report', LEFT, 110, 25, true, C.white)
      text('SUBMITTED  ' + submittedAt.toLocaleDateString('en-GB', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' }), LEFT, 178, 9, true, C.muted)
      text('AUTHOR  ' + (answers.q3 || '-').slice(0, 38), 315, 178, 9, true, C.muted)
    }
  }
  const ensure = (height: number) => { if (y + height > MAX_Y) newPage(true) }
  newPage()
  const lead = answers.q1 || 'Untitled Activity'
  const leadLines = wrap(lead, 65).slice(0, 4)
  ensure(leadLines.length * 20 + 27)
  leadLines.forEach((line) => { text(line, LEFT, y + 14, 15, true, C.navy); y += 20 })
  y += 20
  for (const step of AAR_STEPS) {
    const fields = AAR_FIELDS.filter((f) => f.id >= step.from && f.id <= step.to && aarVisible(f, answers))
    ensure(65)
    rect(LEFT, y, RIGHT - LEFT, 33, C.soft)
    rect(LEFT, y, 5, 33, C.violet)
    text(step.title.toUpperCase(), LEFT + 16, y + 22, 11, true, C.navy)
    y += 49
    for (const field of fields) {
      const value = field.id === 32
        ? (attachments.map((a) => a.name).join(', ') || '-')
        : aarDisplayValue(field, answers)
      const lines = wrap(value, 91)
      ensure(22)
      text(String(field.id).padStart(2, '0') + '  ' + field.label, LEFT + 2, y, 9.5, true, C.violet)
      y += 18
      for (const line of lines) {
        ensure(15)
        text(line, LEFT + 22, y, 10, false, C.ink)
        y += 15
      }
      y += 15
      ensure(1)
      rect(LEFT, y, RIGHT - LEFT, 0.7, C.line)
      y += 13
    }
    y += 8
  }
  pages.push(ops)
  // Paint fixed footer on every page; build PDF object / xref offsets using byte lengths.
  pages.forEach((p, i) => {
    p.push(C.line + ' rg ' + LEFT + ' 47 ' + (RIGHT - LEFT) + ' 0.7 re f')
    p.push('BT /F1 9 Tf ' + C.muted + ' rg 1 0 0 1 ' + LEFT + ' 31 Tm (SIM PUSKAPA  -  AFTER ACTIVITY REPORT) Tj ET')
    p.push('BT /F2 9 Tf ' + C.violet + ' rg 1 0 0 1 ' + (RIGHT - 63) + ' 31 Tm (PAGE ' + (i + 1) + ' / ' + pages.length + ') Tj ET')
  })
  const objects: Buffer[] = []
  const add = (data: string | Buffer): number => { objects.push(Buffer.isBuffer(data) ? data : Buffer.from(data, 'latin1')); return objects.length }
  const catalog = add('')
  const root = add('')
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pageNumbers: number[] = []
  for (const commands of pages) {
    const stream = Buffer.from(commands.join('\n') + '\n', 'latin1')
    const streamId = add(Buffer.concat([Buffer.from('<< /Length ' + stream.length + ' >>\nstream\n'), stream, Buffer.from('endstream')]))
    const pageId = add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + streamId + ' 0 R >>')
    pageNumbers.push(pageId)
  }
  objects[catalog - 1] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>')
  objects[root - 1] = Buffer.from('<< /Type /Pages /Kids [' + pageNumbers.map((n) => n + ' 0 R').join(' ') + '] /Count ' + pages.length + ' >>')
  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')]
  const offsets = [0]
  let position = parts[0].length
  for (let i = 0; i < objects.length; i++) {
    offsets.push(position)
    const b = Buffer.concat([Buffer.from((i + 1) + ' 0 obj\n'), objects[i], Buffer.from('\nendobj\n')])
    parts.push(b)
    position += b.length
  }
  const xref = position
  parts.push(Buffer.from('xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n'))
  offsets.slice(1).forEach((n) => parts.push(Buffer.from(String(n).padStart(10, '0') + ' 00000 n \n')))
  parts.push(Buffer.from('trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF'))
  return Buffer.concat(parts)
}
