import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'

type WarningAlertProps = {
  title: string
  description: string
}

/**
 * Reusable warning alert component for displaying important notices
 */
export const WarningAlert = ({ title, description }: WarningAlertProps) => {
  return (
    <div className="mb-5 flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-[22px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
        <AlertTriangleIcon className="h-6 w-6 stroke-primary-600" />
      </div>
      <div>
        <h6 className="mb-1 font-semibold text-gray-900">{title}</h6>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
