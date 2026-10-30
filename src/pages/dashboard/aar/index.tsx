import { Dashboard } from '@/layout/Dashboard'
import { AarReport, aarApi } from '@/utils/aar.api'
import { resolveAuthToken } from '@/utils/ssrAuth'
import { JwtLib } from '@/shared/jwt.lib'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ArrowRight, FileText, Plus, Search, Download, RefreshCw } from 'lucide-react'

const formatDate = (date: string | null) => {
  if (!date) return '-'
  const value = date.slice(0, 10)
  const parsed = new Date(value + 'T00:00:00Z')
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })
}

const AARIndex = ({ canAccessAar }: { canAccessAar: boolean }) => {
  const router = useRouter()
  const [items, setItems] = useState<AarReport[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const reload = async () => {
    if (!canAccessAar) return
    try {
      setItems(await aarApi.list())
    } catch (err) {
      toast.error('Gagal memuat daftar AAR')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload()
  }, [])
  useEffect(() => setPage(1), [keyword, status])
  const filtered = useMemo(
    () =>
      items.filter((x) => {
        const search = [x.activity_code, x.activity_name, x.organizer, x.author].join(' ').toLowerCase()
        return (status === 'all' || x.status === status) && search.includes(keyword.toLowerCase().trim())
      }),
    [items, keyword, status],
  )
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)
  const countDraft = items.filter((x) => x.status === 'draft').length
  const countSubmitted = items.filter((x) => x.status === 'submitted').length

  const createNew = async () => {
    if (!canAccessAar) return
    setCreating(true)
    try {
      const report = await aarApi.create()
      await router.push('/dashboard/aar/' + report.id)
    } catch {
      toast.error('Tidak dapat membuat AAR baru')
      setCreating(false)
    }
  }

  if (!canAccessAar) {
    return (
      <>
        <NextSeo title="After Activity Report - In Development" />
        <Dashboard
          breadcrumbLists={[
            { title: 'Project', url: '/dashboard/project' },
            { title: 'After Activity Report', url: '' },
          ]}
        >
          <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#f7f8fa] px-5 py-12">
            <div className="sim-modern-panel w-full max-w-2xl rounded-3xl border border-[#e7eaf4] bg-white px-8 py-16 text-center shadow-sm">
              <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600">
                <FileText size={38} />
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-600">
                SIM PUSKAPA / After Activity Report
              </p>

              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">In Development</h1>

              <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-gray-500">
                Fitur After Activity Report sedang dalam tahap pengembangan dan pengujian. Fitur ini akan segera
                tersedia untuk seluruh pengguna SIM PUSKAPA.
              </p>

              <div className="mt-8 inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-5 py-2.5 text-xs font-semibold text-primary-700">
                Coming Soon
              </div>

              <div className="mt-10">
                <Link
                  href="/dashboard/project"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#26375c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#19284c]"
                >
                  Kembali ke Project List
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </Dashboard>
      </>
    )
  }

  return (
    <>
      <NextSeo title="After Activity Report" />
      <Dashboard
        breadcrumbLists={[
          { title: 'Project', url: '/dashboard/project' },
          { title: 'After Activity Report', url: '' },
        ]}
      >
        <div className="sim-project-list-v2 min-h-[calc(100vh-80px)] bg-[#f7f8fa]">
          <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-7 py-6 sm:flex-row sm:items-center sm:justify-between xl:px-10">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-primary-600">
                <FileText size={15} /> Project / Reporting
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">After Activity Report</h1>
              <p className="mt-1 text-sm text-gray-500">
                Kelola laporan kegiatan, simpan draft, dan pantau progres AAR.
              </p>
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={createNew}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-200 transition hover:bg-primary-700 disabled:opacity-60"
            >
              <Plus size={17} /> {creating ? 'Membuat AAR...' : 'Add New AAR'}
            </button>
          </div>
          <div className="space-y-6 px-7 py-7 xl:px-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Total AAR',
                  number: items.length,
                  hint: 'Semua laporan tersimpan',
                  mark: 'bg-primary-100 text-primary-700',
                },
                {
                  label: 'In Progress',
                  number: countDraft,
                  hint: 'Draft yang belum disubmit',
                  mark: 'bg-warning-100 text-warning-700',
                },
                {
                  label: 'Submitted',
                  number: countSubmitted,
                  hint: 'Laporan selesai',
                  mark: 'bg-success-100 text-success-700',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="sim-modern-panel rounded-2xl border border-[#e9edf3] bg-white p-5 shadow-sm"
                  style={{ padding: '20px', borderTopColor: '#e9edf3' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.label}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className={'rounded-xl px-4 py-2 text-2xl font-bold ' + card.mark}>{card.number}</span>
                    <p className="text-xs text-gray-400">{card.hint}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#e9edf3] bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-800">AAR List</h2>
                  <p className="mt-1 text-xs text-gray-500">Activity overview & submission history</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      aria-label="Search AAR"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Search AAR..."
                      className="w-52 rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
                    />
                  </div>
                  <select
                    aria-label="Filter status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                  </select>
                  <button
                    onClick={reload}
                    aria-label="Refresh AAR"
                    className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                  <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-gray-500">
                    <tr>
                      {['Activity Code', 'Activity Name', 'Organizer', 'Author', 'AAR Progress', 'Start Date', ''].map(
                        (h) => (
                          <th key={h} className="whitespace-nowrap border-b border-gray-100 px-5 py-4 font-bold">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="px-5 py-12 text-center text-gray-400" colSpan={7}>
                          Loading AAR...
                        </td>
                      </tr>
                    ) : !shown.length ? (
                      <tr>
                        <td className="px-5 py-14 text-center text-gray-500" colSpan={7}>
                          Belum ada AAR. Klik Add New AAR untuk membuat laporan.
                        </td>
                      </tr>
                    ) : (
                      shown.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 transition hover:bg-primary-50/30">
                          <td className="px-5 py-4 font-semibold text-primary-700">{r.activity_code || '-'}</td>
                          <td className="max-w-[250px] px-5 py-4">
                            <p className="line-clamp-2 font-semibold text-gray-900">
                              {r.activity_name || 'Untitled Activity'}
                            </p>
                            <span
                              className={
                                'mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ' +
                                (r.status === 'submitted'
                                  ? 'bg-success-50 text-success-700'
                                  : 'bg-warning-50 text-warning-700')
                              }
                            >
                              {r.status === 'submitted' ? 'SUBMITTED' : 'DRAFT'}
                            </span>
                          </td>
                          <td className="max-w-[170px] px-5 py-4 text-gray-600">{r.organizer || '-'}</td>
                          <td className="px-5 py-4 font-medium text-gray-700">{r.author || '-'}</td>
                          <td className="min-w-[155px] px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={
                                    'h-full rounded-full ' + (r.progress === 100 ? 'bg-success-500' : 'bg-primary-500')
                                  }
                                  style={{ width: (r.progress || 0) + '%' }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{r.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(r.start_date)}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {r.status === 'submitted' && (
                                <button
                                  title="Download PDF"
                                  onClick={() => aarApi.download(r.id).catch(() => toast.error('Gagal download PDF'))}
                                  className="rounded-lg border border-gray-200 p-2 text-primary-600 hover:bg-primary-50"
                                >
                                  <Download size={16} />
                                </button>
                              )}
                              <Link
                                href={'/dashboard/aar/' + r.id}
                                title={r.status === 'draft' ? 'Continue draft' : 'View AAR'}
                                className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                              >
                                <ArrowRight size={16} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-xs text-gray-500">
                <span>
                  Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)}{' '}
                  of {filtered.length} AAR
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((x) => x - 1)}
                    className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page * pageSize >= filtered.length}
                    onClick={() => setPage((x) => x + 1)}
                    className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dashboard>
    </>
  )
}
export default AARIndex

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = resolveAuthToken(ctx.res.getHeader('set-cookie'), ctx.req.cookies.auth_token)

  try {
    if (!token) throw new Error('Missing auth token')

    const claims = await JwtLib.decodeJwtToken(token)

    return {
      props: {
        activeSidebar: 'After Activity Report',
        canAccessAar: claims.email?.trim().toLowerCase() === 'admin@puskapa.org',
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
