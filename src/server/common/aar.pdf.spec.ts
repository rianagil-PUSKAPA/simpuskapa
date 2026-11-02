import { buildAarPdf } from './aar.pdf'
import { AarAnswers, AAR_FIELDS, aarMissing, aarProgress } from '@/shared/aar.questions'

describe('After Activity Report', () => {
  it('renders a readable multi-page PDF with the right header and xref', () => {
    const data: AarAnswers = {}
    for (const f of AAR_FIELDS) {
      if (f.kind === 'file') continue
      data['q' + f.id] =
        f.kind === 'date'
          ? '2026-10-30'
          : f.kind === 'count'
          ? '0'
          : f.kind === 'select' || f.kind === 'selectOther' || f.kind === 'radio' || f.kind === 'radioOther'
          ? f.options[0]
          : 'Contoh kegiatan PUSKAPA. '.repeat(20)
    }
    data.q1 = 'Pelatihan Meneliti Bersama Anak'
    data.q3 = 'Penulis AAR'
    data.q30 = 'No'
    const pdf = buildAarPdf(data, [{ id: '1', name: 'Dokumentasi.pdf' }], new Date('2026-10-30T07:00:00Z'))
    const raw = pdf.toString('latin1')
    expect(raw.startsWith('%PDF-1.4')).toBe(true)
    expect(raw).toContain('After Activity')
    expect(raw).toContain('Dokumentasi.pdf')
    expect(raw).toContain('xref\n0 ')
    expect(raw.endsWith('%%EOF')).toBe(true)
    const position = Number(raw.match(/startxref\n(\d+)\n%%EOF$/)[1])
    expect(raw.slice(position, position + 4)).toBe('xref')
    expect((raw.match(/\/Type \/Page \/Parent/g) || []).length).toBeGreaterThan(1)
    expect(pdf.length).toBeGreaterThan(1000)
  })

  it('calculates draft progress and required answers from the original 33 questions', () => {
    expect(AAR_FIELDS).toHaveLength(33)
    expect(aarProgress({})).toBe(0)
    expect(aarMissing({}).length).toBeGreaterThan(20)
    const data: AarAnswers = {}
    for (const f of AAR_FIELDS.filter((f) => f.required)) {
      data['q' + f.id] = f.kind === 'date' ? '2026-10-30' : f.kind === 'count' ? 'N/A' : f.options?.[0] || 'Example'
    }
    expect(aarMissing(data)).toHaveLength(0)
    expect(aarProgress(data)).toBe(100)
  })
})
