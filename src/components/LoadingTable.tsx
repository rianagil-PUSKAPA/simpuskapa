import { Fragment } from 'react'

type Props = {
  totalRows?: number
}

export const LoadingTable = ({ totalRows = 5 }: Props) => {
  return (
    <div className="mt-3 w-full animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-40 rounded-sm bg-gray-200"></div>
        <div className="h-8 w-48 rounded-sm bg-gray-200"></div>
      </div>
      <div className="flex h-10 items-center gap-6 rounded-t bg-gray-300/70 px-4">
        <div className="h-2.5 grow rounded-sm bg-gray-400/70"></div>
        <div className="h-2.5 grow rounded-sm bg-gray-400/70"></div>
        <div className="h-2.5 grow rounded-sm bg-gray-400/70"></div>
        <div className="h-2.5 grow rounded-sm bg-gray-400/70"></div>
        <div className="h-2.5 grow rounded-sm bg-gray-400/70"></div>
      </div>
      {[...Array(totalRows)].map((_, index) => (
        <Fragment key={index}>
          <div className="flex h-14 items-center gap-6 bg-gray-100 px-4">
            <div className="h-2.5 grow rounded-sm bg-gray-200"></div>
            <div className="h-2.5 grow rounded-sm bg-gray-200"></div>
            <div className="h-2.5 grow rounded-sm bg-gray-200"></div>
            <div className="h-2.5 grow rounded-sm bg-gray-200"></div>
            <div className="h-2.5 grow rounded-sm bg-gray-200"></div>
          </div>
          <div className="h-px grow rounded-sm bg-gray-300"></div>
        </Fragment>
      ))}
    </div>
  )
}
