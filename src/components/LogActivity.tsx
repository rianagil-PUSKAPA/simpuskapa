import { SafeHtml } from '@/components/SafeHtml'
import { isMoreThan24Hours } from '@/utils/globalHelper'
import { Log } from '@sdk'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import { useEffect, useState } from 'react'

dayjs.extend(utc)
dayjs.extend(relativeTime)

type Props = {
  logProgram?: Log[]
  globalLog?: Log[]
  isUsedAtProject?: boolean
}

export const LogActivity = ({ globalLog: logData, logProgram, isUsedAtProject = false }: Props) => {
  const [isMounted, setIsMounted] = useState(false)
  const [projectLogQuery, setProjectLogQuery] = useState('')
  const filteredProjectLogs = (logProgram || []).filter((log) =>
    `${log.user?.name || ''} ${log.message || ''} ${log.body || ''}`
      .toLowerCase()
      .includes(projectLogQuery.trim().toLowerCase()),
  )

  useEffect(() => {
    const dashboardLeftSide = document.getElementById('dashboard-left-side')
    const logActivityheightContainer = document.getElementById('height-container')
    if (dashboardLeftSide && logActivityheightContainer) {
      logActivityheightContainer.style.height = `${dashboardLeftSide.scrollHeight - 62}px`
    } else {
      if (logActivityheightContainer) {
        logActivityheightContainer.style.height = '100%'
      }
    }
  }, [logData, isMounted])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  if (isUsedAtProject) {
    return (
      <div id="log-activity-container" className="rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-b-gray-200 px-6 py-5">
          <p className="text-lg font-semibold text-gray-900">Log Activity</p>
        </div>
        <div className="sim-pd-log-tools">
          <span>{filteredProjectLogs.length} activities</span>
          <input
            type="search"
            aria-label="Search project log activity"
            placeholder="Search people or events..."
            value={projectLogQuery}
            onChange={(event) => setProjectLogQuery(event.target.value)}
          />
        </div>
        <div
          id="height-container"
          className="h-0 overflow-auto p-6 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"
        >
          {filteredProjectLogs.length === 0 && (
            <div className="flex h-48 items-center justify-center rounded-xl bg-gray-50">
              {projectLogQuery ? 'No matching activity' : 'No log activity'}
            </div>
          )}
          {filteredProjectLogs.map((log, index) => (
            <div key={index} className="log-activity-card relative flex items-start gap-3">
              <div className="shrink-0">
                <Image
                  className="h-12 w-12 rounded-full object-cover"
                  src={log.user['avatar_url']}
                  alt={log.user.employee_pass_photo}
                  width={48}
                  height={48}
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-700">{log.user.name}</p>
                  <p className="text-xs text-gray-600">
                    {isMoreThan24Hours(log?.created_at)
                      ? dayjs(log?.created_at).local().format('dddd, DD MMM YYYY - HH:mm')
                      : dayjs(log?.created_at).local().fromNow()}
                  </p>
                </div>
                <SafeHtml className="render-html text-sm text-gray-600" html={log.message} />
                {log.body ? <p className="mt-3 text-sm text-gray-600">“{log.body}”</p> : null}
              </div>
              <span className="absolute right-0 top-0 hidden h-2.5 w-2.5 rounded-full bg-success-500"></span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="log-activity-container" className="rounded-xl border border-gray-200 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-b-gray-200 px-6 py-5">
        <p className="text-lg font-semibold text-gray-900">Log Activity</p>
      </div>
      <div
        id="height-container"
        className="h-0 overflow-auto p-6 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"
      >
        {logData?.length === 0 && (
          <div className="flex h-48 items-center justify-center rounded-xl bg-gray-50">No log activity</div>
        )}
        {logData?.map((log, index) => (
          <div key={index} className="log-activity-card relative flex items-start gap-3">
            <div className="shrink-0">
              <Image
                className="h-12 w-12 rounded-full object-cover"
                src={log.user['avatar_url']}
                alt={log.user.employee_pass_photo}
                width={48}
                height={48}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2">
                <p className="text-sm font-medium text-gray-700">{log.user.name}</p>
                <p className="text-xs text-gray-600">
                  {isMoreThan24Hours(log?.created_at)
                    ? dayjs(log?.created_at).local().format('dddd, DD MMM YYYY - HH:mm')
                    : dayjs(log?.created_at).local().fromNow()}
                </p>
              </div>
              <SafeHtml className="render-html text-sm text-gray-600" html={log.message} />
              {log.body ? <p className="mt-3 text-sm text-gray-600">“{log.body}”</p> : null}
            </div>
            <span className="absolute right-0 top-0 hidden h-2.5 w-2.5 rounded-full bg-success-500"></span>
          </div>
        ))}
      </div>
    </div>
  )
}
