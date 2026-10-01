import { Badge } from '@/components/Badge'
import dayjs from 'dayjs'
import Image from 'next/image'

type BudgetStatusCardProps = {
  title: string
  badgeColor: string
  badgeText: string
  avatarUrl: string
  userName: string
  userRole: string
  statusText: string
  timestamp?: string | null
  showBadge?: boolean
}

/**
 * Reusable component to display budget approval/submission status
 */
export const BudgetStatusCard = ({
  title,
  badgeColor,
  badgeText,
  avatarUrl,
  userName,
  userRole,
  statusText,
  timestamp,
  showBadge = true,
}: BudgetStatusCardProps) => {
  return (
    <div>
      <div className="mb-6 inline-flex items-center gap-3.5 font-extrabold text-gray-500">
        {title}
        {showBadge && (
          <Badge size="sm" color={badgeColor as any} icon="circle">
            {badgeText}
          </Badge>
        )}
      </div>
      <div className="rounded-lg border border-gray-300 bg-gray-25 px-5 py-3">
        <div className="inline-flex items-center justify-start gap-4">
          <Image
            src={avatarUrl}
            width={48}
            height={32}
            alt="user-avatar"
            className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
          />
          <div>
            <div className="mb-1 inline-flex flex-wrap items-center text-gray-700">
              <p className="mr-2 text-base font-semibold">{userName}</p>
              <p className="text-sm">({userRole})</p>
            </div>
            {timestamp ? (
              <p className="text-xs text-gray-600">
                {dayjs(timestamp).utc().local().format('dddd, DD MMMM YYYY (HH:mm)')}
              </p>
            ) : (
              <p className="text-xs text-gray-600">{statusText}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
