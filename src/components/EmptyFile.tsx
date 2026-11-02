import { SearchIcon } from './icon/SearchIcon'

type Props = {
  message?: string
  description?: string
}

export const EmptyFile = (props: Props) => {
  const { message, description } = props
  return (
    <div className="rounded-xl border border-gray-200 px-6 py-4">
      <div>
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
          <SearchIcon className="h-5 w-5 stroke-primary-600" />
        </div>
        <p className="mb-1 text-center font-semibold text-gray-900">{message || 'No data found'}</p>
        <p className="text-center text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
