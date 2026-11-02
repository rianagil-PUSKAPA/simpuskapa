// Source: Form AAR PUSKAPA 2026 (33 questions). Shared by UI, validation and PDF.
export type AarField = {
  id: number
  label: string
  en?: string
  kind: 'text' | 'textarea' | 'date' | 'select' | 'selectOther' | 'radio' | 'radioOther' | 'count' | 'file' | 'url'
  required?: boolean
  options?: string[]
  hint?: string
  showIfYes?: boolean
  group?: string
}
export type AarAnswers = Record<string, string>
export const AAR_STEPS = [
  { title: 'Activity Information', description: 'Activity details and implementation', from: 1, to: 10 },
  { title: 'Classification', description: 'Activity type, role and focus area', from: 11, to: 13 },
  { title: 'Facilitators & Participants', description: 'Facilitator and participant information', from: 14, to: 20 },
  { title: 'Activity Report', description: 'Summary, outcomes and follow-up', from: 21, to: 31 },
  { title: 'Documentation', description: 'Attachments and material links', from: 32, to: 33 },
] as const

const types = [
  'Riset (Persiapan, termasuk Penyusunan Desain dan Protokol) -- Research (Preparatory, Design and Protocol Development)',
  'Riset (Pengumpulan Data) -- Research (Data Collection)',
  'Riset (Pengolahan Data) -- Research (Data Processing)',
  'Riset (Analisis Data) -- Research (Data Analysis)',
  'Riset (Penulisan Laporan) -- Research (Report Writing)',
  'Publikasi (Persiapan, Penulisan) -- Publication (Preparation, Writing)',
  'Pengembangan Kapasitas (Pelatihan Eksternal untuk PUSKAPA) -- Capacity Building (External Training for PUSKAPA)',
  'Pengembangan Kapasitas (Pelatihan Internal untuk PUSKAPA) -- Capacity Building (Internal Training for PUSKAPA)',
  'Pengembangan Kapasitas (Menyelenggarakan pelatihan untuk pihak lain termasuk rangkaiannya, persiapan, pelaksanaan, evaluasi) -- Capacity Building (Training from PUSKAPA for others)',
  'Advokasi (Mengikuti Diskusi/Seminar/Lokakarya/Konferensi yang diselenggarakan pihak lain) -- Advocacy (Participate/Attend Discussion/Seminar/Workshop/Conference organized by others)',
  'Advokasi (Mendukung Diskusi/Seminar/Lokakarya/Konferensi yang diselenggarakan bersama mitra) -- Advocacy (Supporting Discussion/Seminar/Workshop/Conference organized by partners)',
  'Advokasi (Menyelenggarakan Diskusi/Seminar/Lokakarya/Konferensi) -- Advocacy (Organizing Discussion/Seminar/Workshop/Conference organized by others)',
  'Bantuan Teknis (semua hal yang tidak termasuk di atas, tetapi terkait dengan bantuan teknis/formulasi kebijakan/masukan untuk kebijakan termasuk dalam rapat dan kunjungan kerja lapangan) -- Technical Assistance (anything outside of the above, related to technical assistance/policy formulation/policy inputs including in meetings and fieldwork)',
  'Manajemen (semua hal terkait teknis pengelolaan kerjasama/grant dengan mitra strategis, pengelolaan dalam dan terkait UKK/UI, dan pengelolaan manajemen lainnya) -- Management (all related to grant management technicalities with strategic partners, management in and with UKK/UI, and other operational management)',
  'Komunikasi Publik (semua hal yang terkait dengan media massa termasuk menerima kunjungan media, diwawancarai media, menyelenggarakan media briefing, dan konferensi pers) -- Public Communication (all related to mass media including hosting media visit, media interview, media briefing, and press conference)',
]
export const AAR_FIELDS: AarField[] = [
  { id: 1, label: 'Judul Kegiatan', en: 'Activity Title', kind: 'text', required: true },
  {
    id: 2,
    label: 'Kategori kegiatan',
    en: 'Activity Category',
    kind: 'radioOther',
    required: true,
    options: ['Daring', 'Luring', 'Other'],
  },
  { id: 3, label: 'Nama Penulis AAR', en: 'Author', kind: 'text', required: true },
  {
    id: 4,
    label: 'Peserta dari PUSKAPA',
    en: 'Participants from PUSKAPA (Full Name)',
    kind: 'textarea',
    required: true,
  },
  { id: 5, label: 'Tanggal Kegiatan Dimulai', en: 'Activity Start Date', kind: 'date', required: true },
  { id: 6, label: 'Tanggal Berakhirnya Kegiatan', en: 'Activity End Date', kind: 'date', required: true },
  { id: 7, label: 'Durasi Kegiatan (Hari/Jam)', en: 'Activity Duration (Days/Hours)', kind: 'text', required: true },
  {
    id: 8,
    label: 'Lembaga dan perwakilan pejabat dari lembaga yang menghadiri',
    en: 'Attending institutions and representatives',
    kind: 'textarea',
    required: true,
    hint: 'Tuliskan paling banyak 5 perwakilan lembaga yang paling berkontribusi. Jika memungkinkan sebutkan nama dan jabatan.',
  },
  {
    id: 9,
    label: 'Tempat Kegiatan',
    en: 'Activity Venue',
    kind: 'text',
    required: true,
    hint: 'Untuk daring, tuliskan aplikasinya. Untuk hybrid: Zoom + Lokasi Kegiatan.',
  },
  { id: 10, label: 'Penyelenggara', en: 'Organizer', kind: 'text', required: true },
  { id: 11, label: 'Tipe Kegiatan', en: 'Type of Activity', kind: 'select', required: true, options: types },
  {
    id: 12,
    label: 'Peran PUSKAPA',
    en: 'PUSKAPA Role',
    kind: 'select',
    required: true,
    options: [
      'Peneliti (Researcher)',
      'Penulis (Author)',
      'Fasilitator (Facilitator)',
      'Pemateri/Narasumber (Speaker/Resource Person)',
      'Fasilitator & Pemateri (Facilitator & Speaker)',
      'Peserta (Participant)',
      'Tenaga Ahli/Mitra Strategis (Expert/Strategic Partner)',
      'Penyelenggara',
    ],
  },
  {
    id: 13,
    label: 'Area Fokus',
    en: 'Focus Area',
    kind: 'selectOther',
    required: true,
    options: [
      "Child's Social Inclusion and Protection",
      'Legal Identity & CRVS',
      'Access to Justice',
      'Youth Engagement',
      'RME-KM-COMMS',
      'Institutional Development',
      'COVID-19 Response Cross-Cutting',
      'Other',
    ],
  },
  {
    id: 14,
    label: 'Jumlah Fasilitator/Pelatih Perempuan',
    en: 'Number of female facilitators/trainers',
    kind: 'count',
    required: true,
    group: 'Facilitators',
  },
  {
    id: 15,
    label: 'Jumlah Fasilitator/Pelatih Laki-Laki',
    en: 'Number of male facilitators/trainers',
    kind: 'count',
    required: true,
  },
  {
    id: 16,
    label: 'Dihadiri Peserta Pemerintah Sejumlah',
    en: 'Number of participant from Government',
    kind: 'count',
    required: true,
    group: 'Participants',
  },
  {
    id: 17,
    label: 'Dihadiri Peserta Non-Pemerintah Sejumlah',
    en: 'Number of participant from Non-Government',
    kind: 'count',
    required: true,
  },
  {
    id: 18,
    label: 'Dihadiri Peserta dari Kelompok Khusus (Dewasa) Sejumlah',
    en: 'Number of Adult participant from special needs group (If any)',
    kind: 'count',
    required: true,
  },
  {
    id: 19,
    label: 'Dihadiri Peserta Anak Sejumlah',
    en: 'Number of Children participant (If any)',
    kind: 'count',
    required: true,
  },
  {
    id: 20,
    label: 'Cerita tentang partisipasi dari kelompok khusus (jika ada)',
    en: 'Role of people with special needs',
    kind: 'textarea',
  },
  {
    id: 21,
    label: 'Sumber Dana yang Mendukung Peran PUSKAPA',
    en: 'Source of Funding to Support PUSKAPA Role',
    kind: 'text',
    required: true,
  },
  { id: 22, label: 'Kode Aktivitas', en: 'Activity Code', kind: 'text', required: true },
  {
    id: 23,
    label: 'Bila Sumber Dana adalah Pemerintah, tolong uraikan',
    en: 'If Source of Funding is the Government of Indonesia, please specify',
    kind: 'textarea',
  },
  { id: 24, label: 'Rangkuman Kegiatan', en: 'Activity Summary', kind: 'textarea', required: true },
  { id: 25, label: 'Pokok Diskusi dalam Kegiatan', en: 'Highlight of Discussion', kind: 'textarea', required: true },
  { id: 26, label: 'Luaran Kegiatan', en: 'Activity Output', kind: 'textarea', required: true },
  { id: 27, label: 'Tindak Lanjut Kegiatan', en: 'Follow up', kind: 'textarea', required: true },
  { id: 28, label: 'Catatan tentang Logistik', en: 'Special Note about Logistics', kind: 'textarea', required: true },
  { id: 29, label: 'Catatan Internal', en: 'Internal Note', kind: 'textarea', required: true },
  {
    id: 30,
    label: 'Adakah cerita menarik yang dapat dituliskan di website atau medium PUSKAPA?',
    en: 'Is there anything interesting story that can be written as an article for PUSKAPA website or medium?',
    kind: 'radio',
    required: true,
    options: ['Yes', 'No'],
  },
  {
    id: 31,
    label: 'Keterangan',
    en: 'Notes',
    kind: 'textarea',
    showIfYes: true,
    group: 'Story of Change Notes',
  },
  { id: 32, label: 'Lampiran', en: 'Attachment', kind: 'file', group: 'Documentation & Data' },
  {
    id: 33,
    label: 'Tautan Materi',
    en: 'Link to Material (If the materials are given as link/the size >1GB)',
    kind: 'url',
  },
]

export function aarFieldValue(a: AarAnswers, n: number): string {
  const v = a['q' + n]
  return typeof v === 'string' ? v.trim() : ''
}
export function aarVisible(f: AarField, a: AarAnswers): boolean {
  return !f.showIfYes || aarFieldValue(a, 30) === 'Yes'
}
export function aarValid(f: AarField, a: AarAnswers): boolean {
  if (!aarVisible(f, a) || !f.required) return true
  const v = aarFieldValue(a, f.id)
  if (!v) return false
  if ((f.kind === 'radioOther' || f.kind === 'selectOther') && v === 'Other') {
    return Boolean(aarFieldValue(a, f.id + 100))
  }
  if (f.kind === 'count') return v === 'N/A' || (/^\d+$/.test(v) && Number.isSafeInteger(Number(v)))
  if (
    (f.kind === 'select' || f.kind === 'radio' || f.kind === 'selectOther' || f.kind === 'radioOther') &&
    !f.options?.includes(v)
  )
    return false
  if (f.kind === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + 'T00:00:00Z').getTime())
  return true
}
export function aarProgress(a: AarAnswers): number {
  const fields = AAR_FIELDS.filter((f) => f.required && aarVisible(f, a))
  return Math.round((fields.filter((f) => aarValid(f, a)).length / fields.length) * 100)
}
export function aarMissing(a: AarAnswers): AarField[] {
  return AAR_FIELDS.filter((f) => f.required && !aarValid(f, a))
}
export function aarDisplayValue(f: AarField, a: AarAnswers): string {
  const v = aarFieldValue(a, f.id)
  if (v === 'Other') return aarFieldValue(a, f.id + 100) || 'Other'
  return v || '-'
}
