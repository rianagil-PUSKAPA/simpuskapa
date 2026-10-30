import { MAIN_URL_BE } from '@/utils/constant'
import axios from 'axios'
import { getCookie } from 'typescript-cookie'
import { AarAnswers } from '@/shared/aar.questions'

export type AarAttachment = { id: string; name: string; size: number; mime: string }
export type AarReport = {
  id: string
  created_by: string
  activity_code: string | null
  activity_name: string | null
  organizer: string | null
  author: string | null
  category: string | null
  start_date: string | null
  answers: AarAnswers
  attachments: AarAttachment[] | null
  status: 'draft' | 'submitted'
  email_status: 'not_sent' | 'sending' | 'sent' | 'failed'
  email_error?: string | null
  progress: number
  created_at: string
  updated_at: string
  submitted_at: string | null
}

const api = axios.create({ baseURL: String(MAIN_URL_BE || '').replace(/\/$/, '') })
api.interceptors.request.use((config) => {
  const token = getCookie('auth_token')
  if (token) {
    config.headers.set('Authorization', 'Bearer ' + token)
  }
  return config
})
// This API returns raw models (unlike the legacy generated SDK's .data.data wrapper).
export const aarApi = {
  list: async (): Promise<AarReport[]> => (await api.get('/v1/aar')).data,
  create: async (): Promise<AarReport> => (await api.post('/v1/aar')).data,
  get: async (id: string): Promise<AarReport> => (await api.get('/v1/aar/' + encodeURIComponent(id))).data,
  save: async (id: string, answers: AarAnswers): Promise<AarReport> =>
    (await api.put('/v1/aar/' + encodeURIComponent(id), { answers })).data,
  submit: async (id: string, answers: AarAnswers): Promise<AarReport> =>
    (await api.post('/v1/aar/' + encodeURIComponent(id) + '/submit', { answers })).data,
  retryEmail: async (id: string): Promise<AarReport> =>
    (await api.post('/v1/aar/' + encodeURIComponent(id) + '/retry-email')).data,
  upload: async (id: string, file: File): Promise<AarAttachment> => {
    const body = new FormData()
    body.append('file', file)
    return (await api.post('/v1/aar/' + encodeURIComponent(id) + '/files', body)).data
  },
  remove: async (id: string, fileId: string): Promise<AarAttachment[]> =>
    (await api.delete('/v1/aar/' + encodeURIComponent(id) + '/files/' + encodeURIComponent(fileId))).data,
  download: async (id: string, fileId?: string) => {
    const url = '/v1/aar/' + encodeURIComponent(id) + (fileId ? '/files/' + encodeURIComponent(fileId) : '/pdf')
    const response = await api.get(url, { responseType: 'blob' })
    const blobUrl = window.URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileId ? 'AAR-Lampiran' : 'After-Activity-Report.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000)
  },
}
