import { Dashboard } from '@/layout/Dashboard'
import { AarSelect } from '@/components/aar/AarSelect'
import { AarReport, aarApi } from '@/utils/aar.api'
import { resolveAuthToken } from '@/utils/ssrAuth'
import { JwtLib } from '@/shared/jwt.lib'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArrowRight,
  FileText,
  Plus,
  Search,
  Download,
  RefreshCw,
} from 'lucide-react'

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
  const [pageSize, setPageSize] = useState(10)
  const reload = async () => {
    if (!canAccessAar) return
    try {
      setItems(await aarApi.list())
    } catch (err) {
      toast.error('Unable to load AAR reports')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload()
  }, [])
  useEffect(() => setPage(1), [keyword, status, pageSize])
  const filtered = useMemo(
    () =>
      items.filter((x) => {
        const search = [x.activity_code, x.activity_name, x.organizer, x.author].join(' ').toLowerCase()
        return (status === 'all' || x.status === status) && search.includes(keyword.toLowerCase().trim())
      }),
    [items, keyword, status],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const shown = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const countDraft = items.filter((x) => x.status === 'draft').length
  const countSubmitted = items.filter((x) => x.status === 'submitted').length

  const createNew = async () => {
    if (!canAccessAar) return
    setCreating(true)
    try {
      const report = await aarApi.create()
      await router.push('/dashboard/aar/' + report.id)
    } catch {
      toast.error('Unable to create a new AAR')
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
                After Activity Report is currently under development and testing. This feature will be available to all
                SIM PUSKAPA users soon.
              </p>

              <div className="mt-8 inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-5 py-2.5 text-xs font-semibold text-primary-700">
                Coming Soon
              </div>

              <div className="mt-10">
                <Link
                  href="/dashboard/project"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#26375c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#19284c]"
                >
                  Back to Project List
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
        <div className="sim-project-list-v2 sim-aar-summary-align min-h-[calc(100vh-80px)] bg-[#f7f8fa]">
          <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-7 py-6 sm:flex-row sm:items-center sm:justify-between xl:px-10">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-primary-600">
                <FileText size={15} /> Project / Reporting
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">After Activity Report</h1>
              <p className="mt-1 text-sm text-gray-500">Manage activity reports, save drafts and track AAR progress.</p>
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={createNew}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-200 transition hover:bg-primary-700 disabled:opacity-60"
            >
              <Plus size={17} /> {creating ? 'Creating AAR...' : 'Add New AAR'}
            </button>
          </div>
          <div className="space-y-6 px-7 py-7 xl:px-10">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  label: 'Total AAR',
                  number: items.length,
                  hint: 'All saved reports',
                  mark: 'bg-primary-100 text-primary-700',
                },
                {
                  label: 'In Progress',
                  number: countDraft,
                  hint: 'Reports awaiting submission',
                  mark: 'bg-warning-100 text-warning-700',
                },
                {
                  label: 'Submitted',
                  number: countSubmitted,
                  hint: 'Completed reports',
                  mark: 'bg-success-100 text-success-700',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="sim-aar-stat-v7 flex min-h-[156px] min-w-0 flex-col justify-between gap-5 overflow-hidden rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:border-primary-200 hover:shadow-md sm:p-6"
                >
                  <p className="min-w-0 text-[12px] font-bold uppercase tracking-[0.08em] text-gray-500">
                    {card.label}
                  </p>

                  <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-4">
                    <span
                      className={
                        'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[27px] font-extrabold tabular-nums leading-none ' +
                        card.mark
                      }
                    >
                      {card.number}
                    </span>

                    <p className="min-w-0 break-words text-[13px] leading-5 text-gray-500">{card.hint}</p>
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
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 sm:w-56"
                    />
                  </div>

                  <div className="w-full min-w-[150px] sm:w-[170px]">
                    <AarSelect
                      value={status}
                      onChange={setStatus}
                      ariaLabel="Filter AAR status"
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'draft', label: 'Draft' },
                        { value: 'submitted', label: 'Submitted' },
                      ]}
                    />
                  </div>

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
                      {[
                        'Activity Code',
                        'Activity Name',
                        'Organizer',
                        'Author',
                        'AAR Progress',
                        'Activity Start Date',
                        '',
                      ].map((h) => (
                        <th key={h} className="whitespace-nowrap border-b border-gray-100 px-5 py-4 font-bold">
                          {h}
                        </th>
                      ))}
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
                          No AAR reports yet. Click Add New AAR to create one.
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
                                  onClick={() =>
                                    aarApi.download(r.id).catch(() => toast.error('Unable to download PDF'))
                                  }
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

              <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-5 text-sm text-gray-500 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Page</span>

                  <input
                    type="number"
                    aria-label="Current page"
                    min={1}
                    max={totalPages}
                    value={safePage}
                    onChange={(event) => {
                      const requested = Number(event.target.value)
                      if (Number.isFinite(requested)) {
                        setPage(Math.max(1, Math.min(totalPages, requested)))
                      }
                    }}
                    className="h-9 w-14 rounded-lg border border-gray-300 bg-white px-2 text-center text-sm text-gray-800 focus:border-primary-400 focus:ring-primary-100"
                  />

                  <span>
                    of {totalPages} {totalPages === 1 ? 'page' : 'pages'}
                  </span>

                  <span className="mx-2 text-gray-300">|</span>

                  <span>Show</span>

                  <select
                    aria-label="Rows per page"
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="h-9 rounded-lg border border-gray-300 bg-white py-1 pl-3 pr-8 text-sm text-gray-800 focus:border-primary-400 focus:ring-primary-100"
                  >
                    {[10, 20, 30, 40, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>

                  <span>data</span>
                </div>

                <div className="inline-flex self-end overflow-hidden rounded-lg border border-gray-200 bg-white sm:self-auto">
                  <button
                    type="button"
                    title="First page"
                    aria-label="First page"
                    disabled={safePage <= 1}
                    onClick={() => setPage(1)}
                    className="flex h-9 w-9 items-center justify-center border-r border-gray-200 text-gray-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronsLeft size={17} />
                  </button>

                  <button
                    type="button"
                    title="Previous page"
                    aria-label="Previous page"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                    className="flex h-9 w-9 items-center justify-center border-r border-gray-200 text-gray-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <button
                    type="button"
                    title="Next page"
                    aria-label="Next page"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(safePage + 1)}
                    className="flex h-9 w-9 items-center justify-center border-r border-gray-200 text-gray-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight size={17} />
                  </button>

                  <button
                    type="button"
                    title="Last page"
                    aria-label="Last page"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(totalPages)}
                    className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronsRight size={17} />
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
