import {
  AAR_FIELDS,
  AAR_STEPS,
  AarAnswers,
  AarField,
  aarDisplayValue,
  aarMissing,
  aarProgress,
  aarValid,
  aarVisible,
} from '@/shared/aar.questions'
import { Dashboard } from '@/layout/Dashboard'
import { AarSelect } from '@/components/aar/AarSelect'
import { AarAttachment, AarReport, aarApi } from '@/utils/aar.api'
import { resolveAuthToken } from '@/utils/ssrAuth'
import { JwtLib } from '@/shared/jwt.lib'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Paperclip,
  Save,
  Send,
  Trash2,
  UploadCloud,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react'

const inputClass =
  'w-full rounded-xl border border-[#e2e7ee] bg-[#f9fafb] px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-100 disabled:opacity-70'
const sections = AAR_STEPS
const date = (s?: string) => (s ? s.slice(0, 10) : '')

const Field = ({
  f,
  answers,
  change,
  disabled,
  files,
  upload,
  removeFile,
  downloadFile,
  uploading,
}: {
  f: AarField
  answers: AarAnswers
  change: (id: number, v: string) => void
  disabled: boolean
  files: AarAttachment[]
  upload: (file: File) => void
  removeFile: (id: string) => void
  downloadFile: (id: string) => void
  uploading: boolean
}) => {
  const value = answers['q' + f.id] || ''
  const [countInputOpen, setCountInputOpen] = useState(value !== '' && value !== 'N/A')
  const otherValue = answers['q' + (f.id + 100)] || ''
  const hasError = f.required && !aarValid(f, answers)
  const id = 'aar-q' + f.id
  const control = () => {
    if (f.kind === 'file')
      return (
        <div className="min-w-0 space-y-4">
          {!disabled && (
            <label className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/40 px-5 py-6 text-center transition hover:border-primary-400 hover:bg-primary-50">
              <UploadCloud size={26} className="mb-2 text-primary-600" />

              <span className="text-sm font-semibold text-gray-800">
                {uploading ? 'Uploading attachment...' : 'Click to upload an attachment'}
              </span>

              <span className="mt-1 text-xs text-gray-500">
                PDF, JPG, PNG, DOCX, XLSX, PPTX | Max. 10 MB per file, up to 10 files
              </span>

              <input
                type="file"
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx"
                disabled={uploading}
                onChange={(event) => {
                  const picked = event.target.files?.[0]
                  if (picked) upload(picked)
                  event.target.value = ''
                }}
              />
            </label>
          )}

          <div className="min-w-0 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {files.length === 0 ? (
              <p className="px-4 py-4 text-xs text-gray-500">No attachments uploaded.</p>
            ) : (
              files.map((file) => (
                <div key={file.id} className="flex min-w-0 flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Paperclip size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-800" title={file.name}>
                      {file.name}
                    </p>

                    <p className="mt-1 text-[11px] text-gray-500">{Math.ceil(file.size / 1024)} KB</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadFile(file.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                    >
                      {file.mime === 'application/pdf' || file.mime?.startsWith('image/') ? (
                        <>
                          <Eye size={15} />
                          View
                        </>
                      ) : (
                        <>
                          <Download size={15} />
                          Download
                        </>
                      )}
                    </button>

                    {!disabled && (
                      <button
                        type="button"
                        aria-label={'Remove ' + file.name}
                        onClick={() => removeFile(file.id)}
                        className="rounded-lg border border-gray-200 p-2 text-error-600 hover:bg-error-50"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {disabled && <p className="text-xs text-gray-500">Submitted files are available to view or download.</p>}
        </div>
      )

    if (f.kind === 'url' && disabled) {
      return /^https?:\/\//i.test(value) ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-2 break-all rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-100"
        >
          <ExternalLink size={16} className="shrink-0" />
          View Material
        </a>
      ) : (
        <p className="text-xs text-gray-500">No material link provided.</p>
      )
    }

    if (f.kind === 'textarea')
      return (
        <textarea
          id={id}
          rows={f.id >= 24 && f.id <= 29 ? 5 : 4}
          disabled={disabled}
          value={value}
          onChange={(e) => change(f.id, e.target.value)}
          placeholder="Enter your answer..."
          className={inputClass + ' resize-y'}
        />
      )

    if (f.kind === 'select' || f.kind === 'selectOther') {
      return (
        <div className="min-w-0 space-y-3">
          <AarSelect
            value={value}
            options={(f.options || []).map((option) => ({
              value: option,
              label: option,
            }))}
            onChange={(selected) => change(f.id, selected)}
            ariaLabel={f.en || f.label}
            id={id}
            disabled={disabled}
            searchable
          />

          {f.kind === 'selectOther' && value === 'Other' && (
            <input
              disabled={disabled}
              value={otherValue}
              onChange={(event) => change(f.id + 100, event.target.value)}
              placeholder="Please specify"
              className={inputClass}
            />
          )}
        </div>
      )
    }

    if (f.kind === 'radio' || f.kind === 'radioOther')
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {f.options?.map((o) => (
              <label
                key={o}
                className={
                  'inline-flex min-w-0 max-w-full cursor-pointer items-center gap-2 break-words rounded-xl border px-4 py-3 text-left text-sm font-medium transition ' +
                  (value === o
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-[#f9fafb] text-gray-600')
                }
              >
                <input
                  type="radio"
                  name={id}
                  value={o}
                  checked={value === o}
                  disabled={disabled}
                  onChange={() => change(f.id, o)}
                  className="accent-primary-600"
                />{' '}
                {o}
              </label>
            ))}
          </div>
          {f.kind === 'radioOther' && value === 'Other' && (
            <input
              disabled={disabled}
              value={otherValue}
              onChange={(e) => change(f.id + 100, e.target.value)}
              placeholder="Please specify..."
              className={inputClass}
            />
          )}
        </div>
      )
    if (f.kind === 'count')
      return (
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={
              'flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm ' +
              (value === 'N/A' ? 'border-primary-400 bg-primary-50' : 'border-gray-200')
            }
          >
            <input
              type="radio"
              name={id}
              disabled={disabled}
              checked={value === 'N/A'}
              onChange={() => {
                setCountInputOpen(false)
                change(f.id, 'N/A')
              }}
              className="accent-primary-600"
            />{' '}
            N/A
          </label>
          <label
            className={
              'flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm ' +
              (value !== 'N/A' && value !== '' ? 'border-primary-400 bg-primary-50' : 'border-gray-200')
            }
          >
            <input
              type="radio"
              name={id}
              disabled={disabled}
              checked={countInputOpen || (value !== 'N/A' && value !== '')}
              onChange={() => {
                setCountInputOpen(true)
                change(f.id, '0')
              }}
              className="accent-primary-600"
            />{' '}
            Jumlah
          </label>
          {(countInputOpen || (value !== '' && value !== 'N/A')) && (
            <input
              id={id}
              type="number"
              min={0}
              step={1}
              disabled={disabled}
              value={value}
              onChange={(e) => change(f.id, e.target.value)}
              className={inputClass + ' !w-40'}
              placeholder="0"
            />
          )}
        </div>
      )
    return (
      <input
        id={id}
        type={f.kind === 'date' ? 'date' : f.kind === 'url' ? 'url' : 'text'}
        disabled={disabled}
        value={value}
        onChange={(e) => change(f.id, e.target.value)}
        placeholder={
          f.kind === 'url'
            ? 'https://drive.google.com/...'
            : f.id === 7
            ? 'Example: 2 days / 16 hours'
            : 'Enter your answer...'
        }
        className={inputClass}
      />
    )
  }

  return (
    <div id={'field-' + f.id} className="min-w-0 border-b border-gray-100 pb-7 last:border-0">
      {f.group && <p className="mb-5 text-xs font-bold uppercase tracking-wide text-primary-700">{f.group}</p>}

      <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] items-start gap-3 sm:gap-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-[11px] font-bold text-primary-700">
          {String(f.id).padStart(2, '0')}
        </span>

        <div className="min-w-0">
          <label htmlFor={id} className="block break-words text-sm font-semibold leading-6 text-gray-800">
            {f.en || f.label}
            {f.required && <span className="ml-1 text-error-600">*</span>}
          </label>

          {f.en && f.label !== f.en && (
            <em className="mt-0.5 block break-words text-xs leading-5 text-gray-500">{f.label}</em>
          )}

          {f.hint && (
            <p className="mt-2 break-words border-l-2 border-primary-100 pl-3 text-xs leading-5 text-gray-500">
              {f.hint}
            </p>
          )}

          <div className="mt-3 min-w-0 max-w-full">{control()}</div>

          {hasError && value && <p className="mt-1 text-xs text-error-600">Please check this answer.</p>}
        </div>
      </div>
    </div>
  )
}

const AARForm = () => {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [report, setReport] = useState<AarReport | null>(null)
  const [answers, setAnswers] = useState<AarAnswers>({})
  const [files, setFiles] = useState<AarAttachment[]>([])
  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState('All changes saved')
  const savingChain = useRef<Promise<unknown>>(Promise.resolve())
  const hydrated = useRef(false)
  const editRevision = useRef(0)
  const submittingInFlight = useRef(false)
  const draft = report?.status === 'draft'

  // Open Report Preview directly when requested by the email link.
  // Existing admin-only SSR/API access remains enforced.
  useEffect(() => {
    if (router.isReady && router.query.preview === '1' && report?.status === 'submitted') {
      setPreview(true)
    }
  }, [router.isReady, router.query.preview, report?.status])
  const progress = aarProgress(answers)
  const load = useCallback(async () => {
    if (!id) return
    try {
      const r = await aarApi.get(id)
      setReport(r)
      setAnswers((r.answers || {}) as AarAnswers)
      setFiles(Array.isArray(r.attachments) ? r.attachments : [])
      hydrated.current = true
      setDirty(false)
      setSaveStatus('All changes saved')
    } catch {
      toast.error('AAR not found')
      router.replace('/dashboard/aar')
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    load()
  }, [load])
  const change = (n: number, value: string) => {
    if (!draft) return
    editRevision.current += 1
    setAnswers((prev) => ({ ...prev, ['q' + n]: value }))
    setDirty(true)
    setSaveStatus('Unsaved changes')
  }
  const saveNow = useCallback(
    (data: AarAnswers) => {
      if (!id) return Promise.resolve(null)
      const task = savingChain.current.catch(() => undefined).then(() => aarApi.save(id, data))
      savingChain.current = task
      return task
    },
    [id],
  )
  useEffect(() => {
    if (!hydrated.current || !dirty || !draft || !id) return
    const revision = editRevision.current
    const timer = window.setTimeout(() => {
      if (submittingInFlight.current) return
      setSaveStatus('Saving draft...')
      saveNow(answers)
        .then((saved) => {
          if (saved) {
            setReport(saved)
            if (revision === editRevision.current) {
              setSaveStatus('Draft saved')
              setDirty(false)
            } else setSaveStatus('Unsaved changes')
          }
        })
        .catch(() => setSaveStatus('Auto-save failed — use Save Draft'))
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [answers, dirty, draft, id, saveNow])
  const manualSave = async () => {
    if (!draft) return
    const revision = editRevision.current
    setSaving(true)
    try {
      const updated = await saveNow(answers)
      if (updated) setReport(updated)
      if (revision === editRevision.current) {
        setDirty(false)
        setSaveStatus('Draft saved')
      }
      toast.success('AAR draft saved')
    } catch {
      toast.error('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }
  const doUpload = async (file: File) => {
    if (!id) return
    setUploading(true)
    try {
      const added = await aarApi.upload(id, file)
      setFiles((old) => [...old, added])
      toast.success('Attachment uploaded')
    } catch {
      toast.error('Upload failed. Check file type and size.')
    } finally {
      setUploading(false)
    }
  }
  const doRemove = async (fileId: string) => {
    if (!id) return
    try {
      setFiles(await aarApi.remove(id, fileId))
    } catch {
      toast.error('Failed to remove attachment')
    }
  }
  const doSubmit = async () => {
    const missing = aarMissing(answers)
    if (missing.length) {
      const first = missing[0]
      setStep(
        Math.max(
          0,
          sections.findIndex((s) => first.id >= s.from && first.id <= s.to),
        ),
      )
      setPreview(false)
      toast.error('Complete required questions: ' + missing.map((f) => f.id).join(', '))
      return
    }
    if (date(answers.q5) > date(answers.q6)) {
      setStep(0)
      setPreview(false)
      toast.error('End date cannot be earlier than start date')
      return
    }
    submittingInFlight.current = true
    setSubmitting(true)
    try {
      await savingChain.current.catch(() => undefined)
      const result = await aarApi.submit(id, answers)
      setReport(result)
      setPreview(false)
      setDirty(false)
      setSaveStatus('Submitted')
      if (result.email_status === 'sent') toast.success('AAR submitted. PDF sent to test email.')
      else toast.warning('AAR submitted, but the PDF email failed. Use Retry Email.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit AAR')
    } finally {
      submittingInFlight.current = false
      setSubmitting(false)
    }
  }
  const retryEmail = async () => {
    try {
      setReport(await aarApi.retryEmail(id))
      toast.success('Email delivery retried')
    } catch {
      toast.error('Failed to retry email delivery')
    }
  }
  const shown = AAR_FIELDS.filter(
    (f) => f.id >= sections[step].from && f.id <= sections[step].to && aarVisible(f, answers),
  )
  const stepComplete = (n: number) =>
    AAR_FIELDS.filter((f) => f.required && f.id >= sections[n].from && f.id <= sections[n].to).every((f) =>
      aarValid(f, answers),
    )
  const fieldsCompleted = AAR_FIELDS.filter((f) => f.required && aarValid(f, answers)).length
  const fieldTotal = AAR_FIELDS.filter((f) => f.required).length
  const next = () => {
    if (step < 4) setStep(step + 1)
    else setPreview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  if (loading)
    return (
      <Dashboard
        breadcrumbLists={[
          { title: 'After Activity Report', url: '/dashboard/aar' },
          { title: 'Loading', url: '' },
        ]}
      >
        <p className="p-10 text-gray-500">Loading report...</p>
      </Dashboard>
    )
  return (
    <>
      <NextSeo title={'AAR - ' + (answers.q1 || 'New Report')} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Project', url: '/dashboard/project' },
          { title: 'After Activity Report', url: '/dashboard/aar' },
          { title: report?.status === 'submitted' ? 'View Report' : 'Form AAR', url: '' },
        ]}
      >
        <div className="min-h-screen bg-[#f7f8fa] pb-20">
          <div className="mx-auto max-w-[1680px] space-y-6 px-5 py-7 xl:px-10">
            <div className="relative overflow-hidden rounded-[22px] border border-[#f0e7dd] bg-gradient-to-r from-white via-white to-[#fff8f1] px-8 py-9 text-gray-900 shadow-sm md:px-11">
              <div className="absolute -right-24 -top-40 h-[340px] w-[340px] rounded-full border border-primary-100" />
              <div className="absolute -right-12 -top-24 h-[260px] w-[260px] rounded-full border border-primary-100" />
              <div className="relative">
                <Link
                  href="/dashboard/aar"
                  className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-primary-700"
                >
                  <ArrowLeft size={15} /> Back to AAR List
                </Link>
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-primary-700">
                  SIM PUSKAPA / Project Reporting
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">After Activity Report</h1>
                <p className="mt-3 max-w-2xl text-sm text-gray-600">
                  Complete your activity report in five steps. Your draft is saved automatically, so you can continue
                  where you left off.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-xs font-bold">
                  {draft ? '● In Progress / Draft' : '✓ Submitted AAR'}
                </div>
              </div>
            </div>
            {report?.status === 'submitted' && (
              <div
                className={
                  'rounded-2xl border p-5 text-sm ' +
                  (report.email_status === 'sent'
                    ? 'border-success-200 bg-success-50 text-success-800'
                    : 'border-warning-200 bg-warning-50 text-warning-800')
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {report.email_status === 'sent'
                        ? 'AAR submitted successfully'
                        : 'AAR submitted — email status: ' + report.email_status}
                    </p>
                    <p className="mt-1 text-xs">Test mode: PDF emails are sent only to rian.agil@puskapa.org.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => aarApi.download(id)}
                      className="rounded-xl bg-white px-4 py-2 font-bold text-primary-700 shadow-sm"
                    >
                      <Download size={15} className="mr-2 inline" /> Download PDF
                    </button>
                    {report.email_status === 'failed' && (
                      <button onClick={retryEmail} className="rounded-xl bg-warning-200 px-4 py-2 font-bold">
                        Retry Email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-gray-800">PUSKAPA AAR Form</h2>
                <p className={draft ? 'text-xs font-semibold text-error-600' : 'text-xs text-gray-500'}>
                  {draft ? 'Fields marked * are required.' : 'Submitted reports are read-only.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {draft && (
                  <button
                    disabled={saving || submitting}
                    onClick={manualSave}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                )}
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-5">
              {sections.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => {
                    setStep(i)
                    setPreview(false)
                  }}
                  className={
                    'rounded-2xl border p-3 text-left transition ' +
                    (step === i && !preview
                      ? 'border-primary-300 bg-primary-50 shadow-md shadow-primary-100'
                      : 'border-[#e9edf3] bg-white hover:border-primary-200')
                  }
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold ' +
                        (step === i && !preview
                          ? 'bg-primary-600 text-white'
                          : stepComplete(i)
                          ? 'bg-success-100 text-success-600'
                          : 'bg-gray-100 text-gray-400')
                      }
                    >
                      {stepComplete(i) ? <Check size={15} /> : String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {s.from}–{s.to}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-700">{s.title}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-[22px] border border-[#e9edf3] bg-white shadow-sm">
                {preview ? (
                  <>
                    <div className="border-b border-gray-100 px-7 py-7">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-primary-600">
                        Review & Submit
                      </p>
                      <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Report Preview</h2>
                      <p className="mt-1 text-xs text-gray-500">
                        Review your answers before submitting and emailing the PDF.
                      </p>
                    </div>
                    <div className="max-h-[650px] space-y-5 overflow-y-auto px-7 py-6">
                      {sections.map((s) => (
                        <div key={s.title}>
                          <h3 className="mb-3 border-b border-primary-100 pb-2 text-sm font-extrabold text-primary-700">
                            {s.title}
                          </h3>
                          {AAR_FIELDS.filter((f) => f.id >= s.from && f.id <= s.to && aarVisible(f, answers)).map(
                            (f) => (
                              <div key={f.id} className="mb-4">
                                <p className="text-xs font-bold text-gray-500">
                                  {f.id}. {f.en || f.label}
                                </p>

                                <div className="mt-1 min-w-0 break-words text-sm text-gray-800">
                                  {f.kind === 'file' ? (
                                    files.length ? (
                                      <div className="flex flex-wrap gap-2">
                                        {files.map((file) => (
                                          <button
                                            type="button"
                                            key={file.id}
                                            onClick={() => {
                                              void aarApi
                                                .previewAttachment(id, file)
                                                .catch(() => toast.error('Unable to open attachment'))
                                            }}
                                            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                                          >
                                            <Paperclip size={14} className="shrink-0" />
                                            <span className="max-w-[220px] truncate">{file.name}</span>
                                            {file.mime === 'application/pdf' || file.mime?.startsWith('image/')
                                              ? 'View'
                                              : 'Download'}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      '-'
                                    )
                                  ) : f.kind === 'url' && /^https?:\/\//i.test(aarDisplayValue(f, answers)) ? (
                                    <a
                                      href={aarDisplayValue(f, answers)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex max-w-full items-center gap-2 break-all text-primary-700 underline underline-offset-2"
                                    >
                                      <ExternalLink size={15} className="shrink-0" />
                                      View Material
                                    </a>
                                  ) : (
                                    <p className="whitespace-pre-wrap break-words">{aarDisplayValue(f, answers)}</p>
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-7 py-7">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-600">
                          SECTION {String(step + 1).padStart(2, '0')} OF 05
                        </p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">
                          {sections[step].title}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">{sections[step].description}</p>
                      </div>
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-2xl font-black text-primary-500">
                        {String(step + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="min-w-0 space-y-7 px-5 py-7 sm:px-6 md:px-8">
                      {shown.map((f) => (
                        <Field
                          key={f.id}
                          f={f}
                          answers={answers}
                          change={change}
                          disabled={!draft}
                          files={files}
                          upload={doUpload}
                          removeFile={doRemove}
                          downloadFile={(fileId) => {
                            const file = files.find((item) => item.id === fileId)

                            if (file) {
                              void aarApi
                                .previewAttachment(id, file)
                                .catch(() => toast.error('Unable to open attachment'))
                            }
                          }}
                          uploading={uploading}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-[#f9fafb] px-7 py-5">
                  <button
                    type="button"
                    onClick={() => {
                      if (preview) setPreview(false)
                      else setStep(Math.max(0, step - 1))
                    }}
                    disabled={!preview && step === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-600 disabled:opacity-40"
                  >
                    <ArrowLeft size={16} /> {preview ? 'Back to Form' : 'Previous'}
                  </button>
                  {preview ? (
                    draft ? (
                      <button
                        type="button"
                        disabled={submitting || saving || uploading}
                        onClick={doSubmit}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-primary-200 disabled:opacity-60"
                      >
                        <Send size={16} />
                        {submitting ? 'Submitting...' : 'Submit AAR'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => aarApi.download(id)}
                        className="rounded-xl bg-primary-600 px-5 py-3 text-xs font-bold text-white"
                      >
                        Download PDF
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={next}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-primary-200"
                    >
                      {step === 4 ? 'Preview Report' : 'Next Section'} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
              <aside className="space-y-4 xl:sticky xl:top-6">
                <div className="rounded-[21px] border border-[#e9edf3] bg-white p-6 shadow-sm">
                  <p className="text-xs font-extrabold text-gray-800">AAR Completion</p>

                  <div className="my-6 flex items-center justify-center">
                    <div
                      className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full p-[12px]"
                      style={{
                        background: `conic-gradient(#ff7b00 ${progress}%, #e9edf3 ${progress}%)`,
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white p-2 text-center">
                        <span className="text-[27px] font-extrabold tabular-nums leading-none text-gray-900">
                          {progress}%
                        </span>
                        <span className="mt-2 text-xs text-gray-500">completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: progress + '%' }}
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-gray-400">
                    {fieldsCompleted} of {fieldTotal} required questions completed
                  </p>
                  <div className="mt-5 space-y-3">
                    {sections.map((s, i) => (
                      <button
                        type="button"
                        onClick={() => {
                          setStep(i)
                          setPreview(false)
                        }}
                        key={s.title}
                        className="flex w-full items-center gap-2 text-left text-xs"
                      >
                        <span
                          className={
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ' +
                            (stepComplete(i) ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500')
                          }
                        >
                          {stepComplete(i) ? <Check size={13} /> : i + 1}
                        </span>
                        <span className="flex-1 text-gray-600">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e9edf3] bg-white p-5 shadow-sm">
                  <p className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <ClipboardList size={16} className="text-primary-500" /> Draft Status
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{draft ? saveStatus : 'Report submitted (read-only)'}</p>
                  <p className="mt-3 text-[11px] text-gray-400">
                    Laporan yang disubmit akan dikirim sebagai PDF modern melalui email uji ke rian.agil@puskapa.org.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </Dashboard>
    </>
  )
}
export default AARForm

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = resolveAuthToken(ctx.res.getHeader('set-cookie'), ctx.req.cookies.auth_token)

  try {
    if (!token) throw new Error('Missing auth token')

    const claims = await JwtLib.decodeJwtToken(token)

    if (claims.email?.trim().toLowerCase() !== 'admin@puskapa.org') {
      return {
        redirect: {
          destination: '/dashboard/aar',
          permanent: false,
        },
      }
    }

    return {
      props: {
        activeSidebar: 'After Activity Report',
      },
    }
  } catch {
    return {
      redirect: {
        destination: '/refresh',
        permanent: false,
      },
    }
  }
}
